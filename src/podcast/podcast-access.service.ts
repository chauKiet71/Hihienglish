import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { findPublicVideo, PUBLIC_VIDEOS } from '../catalog/public-videos';

export interface PodcastPolicy {
  videoId: string;
  isPremium: boolean;
  previewSeconds: number;
}
export interface PodcastViewer {
  role?: string;
  isPremium?: boolean;
  premiumExpiresAt?: Date | string | null;
}
export interface PodcastPlaybackAccess extends PodcastPolicy {
  canListenFull: boolean;
  previewLimitSeconds: number | null;
  premiumExpiresAt: string | null;
}

@Injectable()
export class PodcastAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccessMap(): Promise<Record<string, PodcastPolicy>> {
    const rows = await this.prisma.podcastAccess.findMany({
      select: { videoId: true, isPremium: true, previewSeconds: true },
    });
    const ids = new Set(PUBLIC_VIDEOS.map((video) => video.id));
    return Object.fromEntries(
      rows
        .filter((row) => ids.has(row.videoId))
        .map((row) => [row.videoId, row]),
    );
  }

  async getPlaybackAccess(
    videoId: string,
    viewer?: PodcastViewer | null,
  ): Promise<PodcastPlaybackAccess> {
    const video = this.findVideo(videoId);
    const row = await this.prisma.podcastAccess.findUnique({
      where: { videoId },
      select: { videoId: true, isPremium: true, previewSeconds: true },
    });
    const policy = row ?? {
      videoId,
      isPremium: false,
      previewSeconds: Math.min(120, video.duration - 1),
    };
    const expiresAt = viewer?.premiumExpiresAt
      ? new Date(viewer.premiumExpiresAt)
      : null;
    // Management permissions do not grant a Premium subscription.
    const premium =
      viewer?.isPremium === true &&
      (!expiresAt || expiresAt.getTime() > Date.now());
    const limited = policy.isPremium && !premium;
    return {
      ...policy,
      canListenFull: !limited,
      previewLimitSeconds: limited
        ? Math.min(policy.previewSeconds, video.duration)
        : null,
      premiumExpiresAt: premium && expiresAt ? expiresAt.toISOString() : null,
    };
  }

  async setAccess(
    videoId: string,
    isPremium: boolean,
    previewSeconds: number,
  ): Promise<PodcastPolicy> {
    const video = this.findVideo(videoId);
    if (
      typeof isPremium !== 'boolean' ||
      !Number.isInteger(previewSeconds) ||
      previewSeconds < 0 ||
      previewSeconds >= video.duration ||
      previewSeconds > 86399
    ) {
      throw new BadRequestException(
        'Thời gian nghe thử phải là số giây nguyên, từ 0 và ngắn hơn thời lượng video.',
      );
    }
    return this.prisma.podcastAccess.upsert({
      where: { videoId },
      create: { videoId, isPremium, previewSeconds },
      update: { isPremium, previewSeconds },
      select: { videoId: true, isPremium: true, previewSeconds: true },
    });
  }

  private findVideo(videoId: string) {
    const video = findPublicVideo(videoId);
    if (!video) throw new NotFoundException('Không tìm thấy podcast này.');
    return video;
  }
}
