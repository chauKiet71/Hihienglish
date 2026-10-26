import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ImportCandidate } from './catalog.types';
import { extractYoutubeVideoId } from '../video-translate/youtube.util';

type ChannelItem = {
  id: string;
  snippet: {
    title: string;
    description?: string;
    customUrl?: string;
    thumbnails?: Record<string, { url: string }>;
  };
  contentDetails: { relatedPlaylists: { uploads: string } };
};
type VideoItem = {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    publishedAt: string;
    liveBroadcastContent?: string;
  };
  contentDetails: { duration: string; regionRestriction?: unknown };
  status: {
    embeddable?: boolean;
    privacyStatus?: string;
    uploadStatus?: string;
  };
};
export function youtubeDuration(value: string): number {
  const match =
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(
      value,
    );
  if (!match) return 0;
  return Math.floor(
    Number(match[1] || 0) * 86400 +
      Number(match[2] || 0) * 3600 +
      Number(match[3] || 0) * 60 +
      Number(match[4] || 0),
  );
}
export function channelFilter(input: string): Record<string, string> {
  const value = input.trim();
  if (/^UC[\w-]{22}$/.test(value)) return { id: value };
  if (/^@[\p{L}\p{N}_.-]{1,100}$/u.test(value)) return { forHandle: value };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException(
      'Nhập URL kênh YouTube, @handle hoặc mã kênh UC.',
    );
  }
  if (
    url.protocol !== 'https:' ||
    !['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(
      url.hostname,
    ) ||
    url.username ||
    url.password ||
    url.port
  )
    throw new BadRequestException(
      'Chỉ chấp nhận địa chỉ kênh trên youtube.com.',
    );
  let path: string[];
  try {
    path = decodeURIComponent(url.pathname).split('/').filter(Boolean);
  } catch {
    throw new BadRequestException('URL kênh không hợp lệ.');
  }
  if (path[0]?.startsWith('@')) return channelFilter(path[0]);
  if (path[0] === 'channel' && /^UC[\w-]{22}$/.test(path[1] || ''))
    return { id: path[1] };
  if (path[0] === 'user' && /^[\w.-]{1,100}$/.test(path[1] || ''))
    return { forUsername: path[1] };
  throw new BadRequestException(
    'Hãy dùng URL dạng youtube.com/@tenkenh hoặc /channel/UC…',
  );
}

@Injectable()
export class YoutubeCatalogService {
  constructor(private readonly config: ConfigService) {}
  get configured() {
    return !!this.config.get<string>('YOUTUBE_DATA_API_KEY')?.trim();
  }

  private async request<T>(
    resource: string,
    params: Record<string, string>,
  ): Promise<{ items: T[]; nextPageToken?: string }> {
    const key = this.config.get<string>('YOUTUBE_DATA_API_KEY')?.trim();
    if (!key)
      throw new ServiceUnavailableException(
        'Chưa cấu hình kết nối YouTube. Quản trị hệ thống cần đặt YOUTUBE_DATA_API_KEY trên máy chủ.',
      );
    const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
    url.search = new URLSearchParams({ ...params, key }).toString();
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    } catch {
      throw new ServiceUnavailableException(
        'Không kết nối được YouTube. Hãy thử lại sau.',
      );
    }
    if (!response.ok)
      throw new ServiceUnavailableException(
        response.status === 403 || response.status === 429
          ? 'YouTube từ chối yêu cầu. Hãy kiểm tra khóa API, quyền YouTube Data API và hạn mức sử dụng.'
          : 'YouTube chưa trả được dữ liệu. Hãy thử lại sau.',
      );
    return response.json();
  }

  async channel(input: string) {
    const response = await this.request<ChannelItem>('channels', {
      part: 'snippet,contentDetails',
      ...channelFilter(input),
    });
    const item = response.items[0];
    if (!item) throw new NotFoundException('Không tìm thấy kênh YouTube này.');
    return {
      youtubeChannelId: item.id,
      handle: item.snippet.customUrl || item.id,
      name: item.snippet.title,
      description: item.snippet.description || '',
      url: `https://www.youtube.com/channel/${item.id}`,
      avatarUrl:
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url ||
        '',
      uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
    };
  }

  async videos(ids: string[]): Promise<ImportCandidate[]> {
    if (!ids.length) return [];
    const response = await this.request<VideoItem>('videos', {
      part: 'snippet,contentDetails,status',
      id: ids.join(','),
    });
    const byId = new Map(response.items.map((item) => [item.id, item]));
    return ids.flatMap((id) => {
      const item = byId.get(id);
      if (
        !item ||
        !item.status.embeddable ||
        item.status.privacyStatus !== 'public' ||
        (item.snippet.liveBroadcastContent &&
          item.snippet.liveBroadcastContent !== 'none')
      )
        return [];
      const duration = youtubeDuration(item.contentDetails.duration);
      if (!duration || duration > 86400) return [];
      return [
        {
          id,
          title: item.snippet.title,
          duration,
          publishedAt: item.snippet.publishedAt,
          youtubeChannelId: item.snippet.channelId,
        },
      ];
    });
  }

  async page(playlistId: string, pageToken?: string) {
    const response = await this.request<{
      contentDetails: { videoId: string };
    }>('playlistItems', {
      part: 'contentDetails',
      playlistId,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });
    return {
      ids: response.items.map((item) => item.contentDetails.videoId),
      nextPageToken: response.nextPageToken,
    };
  }

  async video(url: string) {
    const id = extractYoutubeVideoId(url);
    if (!id) throw new BadRequestException('URL video YouTube không hợp lệ.');
    const [video] = await this.videos([id]);
    if (!video)
      throw new BadRequestException(
        'Video phải công khai, cho phép phát nhúng và không đang phát trực tiếp.',
      );
    return video;
  }
}
