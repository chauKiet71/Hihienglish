import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PODCAST_CHANNELS } from '../catalog/podcast';
import { VOLKA_CHANNEL, VOLKA_VIDEOS } from '../catalog/volka-videos';
import { YoutubeCatalogService } from './youtube-catalog.service';
import type { CatalogChannel } from './catalog.types';
import { existsSync } from 'fs';
import { join } from 'path';
import { PublicCatalogCacheService } from '../public-cache/public-catalog-cache.service';
import { PublicCatalogKeys } from '../public-cache/public-catalog.keys';

@Injectable()
export class PodcastCatalogService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly youtube: YoutubeCatalogService,
    @Optional() private readonly cache?: PublicCatalogCacheService,
  ) {}

  async onModuleInit() {
    // Backfill only missing rows; deployments never overwrite admin edits.
    const seeds = [
      {
        ...VOLKA_CHANNEL,
        id: 'volka-english',
        channelId: 'UCcvjK35lDPZTlkIrrwxpepg',
        description: '',
        videos: VOLKA_VIDEOS,
      },
      ...PODCAST_CHANNELS,
    ];
    let seeded = false;
    await this.prisma.$transaction(
      async (tx) => {
        const channels = await tx.podcastChannel.createMany({
          data: seeds.map((channel, index) => ({
            id: channel.id,
            youtubeChannelId: channel.channelId,
            handle: channel.handle,
            name: channel.name,
            url: channel.url,
            description: channel.description,
            avatarUrl: channel.avatarUrl,
            sortOrder: index,
          })),
          skipDuplicates: true,
        });
        const videos = await tx.podcastVideo.createMany({
          data: seeds.flatMap((channel) =>
            channel.videos.map((video, sortOrder) => ({
              id: video.id,
              channelId: channel.id,
              title: video.title,
              duration: video.duration,
              sortOrder,
              transcriptStatus:
                existsSync(
                  join(
                    process.cwd(),
                    'storage',
                    'featured-videos',
                    video.id,
                    'transcript-v3.json',
                  ),
                ) ||
                existsSync(
                  join(
                    process.cwd(),
                    'storage',
                    'featured-videos',
                    video.id,
                    'transcript-v2.json',
                  ),
                )
                  ? 'READY'
                  : 'PENDING',
              publishedAt:
                'publishedAt' in video
                  ? new Date(video.publishedAt as string)
                  : null,
            })),
          ),
          skipDuplicates: true,
        });
        seeded = !!(channels?.count || videos?.count);
      },
      { maxWait: 15_000, timeout: 20_000 },
    );
    if (seeded) await this.cache?.invalidate(PublicCatalogKeys.podcasts);
  }

  async list(admin = false): Promise<CatalogChannel[]> {
    const channels = await this.prisma.podcastChannel.findMany({
      where: admin ? {} : { isVisible: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        videos: {
          where: admin ? {} : { isVisible: true },
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
    });
    return channels.map((channel) => ({
      id: channel.id,
      channelId: channel.youtubeChannelId,
      handle: channel.handle,
      name: channel.name,
      url: channel.url,
      description: channel.description,
      avatarUrl: channel.avatarUrl,
      isVisible: channel.isVisible,
      lastSyncedAt: channel.lastSyncedAt?.toISOString() || null,
      videos: channel.videos.map((video) => this.publicVideo(video, channel)),
    }));
  }

  private publicVideo(
    video: {
      id: string;
      title: string;
      duration: number;
      publishedAt: Date | null;
      isVisible: boolean;
      transcriptStatus: string;
    },
    channel: { id: string; name: string },
  ) {
    return {
      id: video.id,
      title: video.title,
      duration: video.duration,
      isVisible: video.isVisible,
      transcriptStatus: video.transcriptStatus,
      publishedAt: video.publishedAt?.toISOString() || null,
      channelName: channel.name,
      channelId: channel.id,
      lessonPath:
        channel.id === 'volka-english'
          ? `/kenh/volka-english/video/${video.id}`
          : `/podcast?channel=${encodeURIComponent(channel.id)}&v=${video.id}`,
    };
  }

  async findVideo(id: string, admin = false) {
    const video = await this.prisma.podcastVideo.findFirst({
      where: {
        id,
        ...(admin ? {} : { isVisible: true, channel: { isVisible: true } }),
      },
      include: { channel: true },
    });
    if (!video)
      throw new NotFoundException(
        'Không tìm thấy podcast này hoặc video đã được ẩn.',
      );
    return this.publicVideo(video, video.channel);
  }

  async addChannel(url: string) {
    const data = await this.youtube.channel(url);
    if (
      await this.prisma.podcastChannel.findUnique({
        where: { youtubeChannelId: data.youtubeChannelId },
      })
    )
      throw new ConflictException('Kênh này đã có trong danh sách.');
    const last = await this.prisma.podcastChannel.aggregate({
      _max: { sortOrder: true },
    });
    try {
      const channel = await this.prisma.podcastChannel.create({
        data: {
          ...data,
          id: data.youtubeChannelId,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
        },
      });
      await this.cache?.invalidate(PublicCatalogKeys.podcasts);
      return channel;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('Kênh này đã có trong danh sách.');
      throw error;
    }
  }

  async setChannelVisible(id: string, isVisible: boolean) {
    if (!(await this.prisma.podcastChannel.findUnique({ where: { id } })))
      throw new NotFoundException('Không tìm thấy kênh.');
    const channel = await this.prisma.podcastChannel.update({
      where: { id },
      data: { isVisible },
    });
    await this.cache?.invalidate(PublicCatalogKeys.podcasts);
    return channel;
  }
  async setVideoVisible(id: string, isVisible: boolean) {
    await this.findVideo(id, true);
    const video = await this.prisma.podcastVideo.update({
      where: { id },
      data: { isVisible },
    });
    await this.cache?.invalidate(PublicCatalogKeys.podcasts);
    return video;
  }
  async setTranscriptStatus(id: string, status: string) {
    const updated = await this.prisma.podcastVideo.updateMany({
      where: { id, transcriptStatus: { not: status } },
      data: { transcriptStatus: status },
    });
    if (updated?.count)
      await this.cache?.invalidate(PublicCatalogKeys.podcasts);
  }
}
