import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { YoutubeCatalogService } from './youtube-catalog.service';
import type {
  CatalogImportJob,
  ImportCandidate,
  ImportMode,
} from './catalog.types';

const jobSelect = {
  id: true,
  channelId: true,
  mode: true,
  requestedCount: true,
  status: true,
  videoUrl: true,
  scannedCount: true,
  importedCount: true,
  errorMessage: true,
  candidatesJson: true,
  createdAt: true,
} as const;
type JobRow = Prisma.PodcastImportJobGetPayload<{ select: typeof jobSelect }>;

@Injectable()
export class PodcastImportService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PodcastImportService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;
  private stopped = false;
  constructor(
    private readonly prisma: PrismaService,
    private readonly youtube: YoutubeCatalogService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.drain(), 2000);
    this.timer.unref();
    void this.drain();
  }
  onModuleDestroy() {
    this.stopped = true;
    clearInterval(this.timer);
  }
  private publicJob(row: JobRow): CatalogImportJob {
    const { candidatesJson, ...job } = row;
    return {
      ...job,
      mode: job.mode as ImportMode,
      createdAt: row.createdAt.toISOString(),
      candidates: candidatesJson as unknown as ImportCandidate[],
    };
  }
  async list(channelId: string) {
    return (
      await this.prisma.podcastImportJob.findMany({
        where: { channelId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: jobSelect,
      })
    ).map((row) => this.publicJob(row));
  }
  async get(id: string) {
    const row = await this.prisma.podcastImportJob.findUnique({
      where: { id },
      select: jobSelect,
    });
    if (!row) throw new NotFoundException('Không tìm thấy phiên nhập video.');
    return this.publicJob(row);
  }

  async create(
    channelId: string,
    mode: ImportMode,
    requestedCount: number,
    videoUrl?: string,
  ) {
    if (!this.youtube.configured)
      throw new ServiceUnavailableException(
        'Chưa cấu hình kết nối YouTube. Quản trị hệ thống cần đặt YOUTUBE_DATA_API_KEY trên máy chủ.',
      );
    if (mode === 'URL' && !videoUrl?.trim())
      throw new BadRequestException('Vui lòng nhập URL video.');
    const row = await this.prisma.$transaction(
      async (tx) => {
        // Serialize submissions for a channel across server processes.
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${channelId}))`;
        if (!(await tx.podcastChannel.findUnique({ where: { id: channelId } })))
          throw new NotFoundException('Không tìm thấy kênh.');
        if (
          await tx.podcastImportJob.findFirst({
            where: { channelId, status: { in: ['QUEUED', 'RUNNING'] } },
          })
        )
          throw new ConflictException(
            'Kênh đang có một phiên lấy video. Hãy đợi phiên đó hoàn tất.',
          );
        return tx.podcastImportJob.create({
          data: {
            channelId,
            mode,
            requestedCount: mode === 'URL' ? 1 : requestedCount,
            videoUrl: mode === 'URL' ? videoUrl : null,
          },
          select: jobSelect,
        });
      },
      { maxWait: 15_000, timeout: 20_000 },
    );
    return this.publicJob(row);
  }

  async commit(id: string, ids: string[]) {
    return this.prisma.$transaction(
      async (tx) => {
        const job = await tx.podcastImportJob.findUnique({ where: { id } });
        if (!job) throw new NotFoundException('Không tìm thấy phiên nhập.');
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${job.channelId}))`;
        if (job.status === 'IMPORTED') return this.publicJob(job);
        if (job.status !== 'READY')
          throw new ConflictException('Phiên nhập chưa sẵn sàng.');
        const candidates = job.candidatesJson as unknown as ImportCandidate[];
        const uniqueIds = [...new Set(ids)];
        if (
          !uniqueIds.length ||
          uniqueIds.some(
            (videoId) => !candidates.some((video) => video.id === videoId),
          )
        )
          throw new BadRequestException(
            'Chỉ được chọn video trong danh sách xem trước.',
          );
        const claimed = await tx.podcastImportJob.updateMany({
          where: { id, status: 'READY' },
          data: { status: 'IMPORTING' },
        });
        if (!claimed.count)
          throw new ConflictException(
            'Phiên nhập đang được xử lý. Hãy tải lại kết quả.',
          );
        const range = await tx.podcastVideo.aggregate({
          where: { channelId: job.channelId },
          _min: { sortOrder: true },
          _max: { sortOrder: true },
        });
        const selected = candidates.filter((video) =>
          uniqueIds.includes(video.id),
        );
        const first =
          job.mode === 'NEWER'
            ? (range._min.sortOrder ?? 0) - selected.length
            : (range._max.sortOrder ?? -1) + 1;
        const result = await tx.podcastVideo.createMany({
          data: selected.map((video, index) => ({
            id: video.id,
            title: video.title,
            duration: video.duration,
            channelId: job.channelId,
            publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
            sortOrder: first + index,
          })),
          skipDuplicates: true,
        });
        const saved = await tx.podcastImportJob.update({
          where: { id },
          data: { status: 'IMPORTED', importedCount: result.count },
        });
        await tx.podcastChannel.update({
          where: { id: job.channelId },
          data: { lastSyncedAt: new Date() },
        });
        return this.publicJob(saved);
      },
      { maxWait: 15_000, timeout: 20_000 },
    );
  }

  private async drain() {
    if (this.running || this.stopped) return;
    this.running = true;
    try {
      const eligible = {
        OR: [
          { status: 'QUEUED' },
          { status: 'RUNNING', leaseUntil: { lt: new Date() } },
        ],
      };
      const job = await this.prisma.podcastImportJob.findFirst({
        where: eligible,
        orderBy: { createdAt: 'asc' },
      });
      if (!job) return;
      const leaseToken = randomUUID();
      const claimed = await this.prisma.podcastImportJob.updateMany({
        where: { id: job.id, ...eligible },
        data: {
          status: 'RUNNING',
          leaseToken,
          leaseUntil: new Date(Date.now() + 180_000),
          errorMessage: null,
          scannedCount: 0,
        },
      });
      if (claimed.count) await this.scan(job, leaseToken);
    } catch {
      this.logger.warn('Chưa xử lý được hàng đợi nhập podcast; sẽ thử lại.');
    } finally {
      this.running = false;
    }
  }

  private async scan(
    job: {
      id: string;
      channelId: string;
      mode: string;
      requestedCount: number;
      videoUrl: string | null;
    },
    leaseToken: string,
  ) {
    const where = { id: job.id, status: 'RUNNING', leaseToken };
    try {
      const channel = await this.prisma.podcastChannel.findUniqueOrThrow({
        where: { id: job.channelId },
      });
      const known = new Set(
        (await this.prisma.podcastVideo.findMany({ select: { id: true } })).map(
          (video) => video.id,
        ),
      );
      const own = new Set(
        (
          await this.prisma.podcastVideo.findMany({
            where: { channelId: channel.id },
            select: { id: true },
          })
        ).map((video) => video.id),
      );
      let scannedCount = 0;
      let candidates: ImportCandidate[] = [];
      if (job.mode === 'URL') {
        const video = await this.youtube.video(job.videoUrl!);
        if (video.youtubeChannelId !== channel.youtubeChannelId)
          throw new BadRequestException('Video không thuộc kênh đang chọn.');
        if (known.has(video.id))
          throw new ConflictException(
            'Video này đã có trong thư viện, kể cả video đang ẩn.',
          );
        candidates = [video];
        scannedCount = 1;
      } else {
        const uploads =
          channel.uploadsPlaylistId ||
          (await this.youtube.channel(channel.youtubeChannelId))
            .uploadsPlaylistId;
        if (!channel.uploadsPlaylistId)
          await this.prisma.podcastChannel.update({
            where: { id: channel.id },
            data: { uploadsPlaylistId: uploads },
          });
        let token: string | undefined;
        let passedKnown = own.size === 0;
        let done = false;
        const started = Date.now();
        const seen = new Set<string>();
        do {
          if (this.stopped) return;
          const page = await this.youtube.page(uploads, token);
          const selectedIds: string[] = [];
          for (const id of page.ids) {
            scannedCount++;
            if (own.has(id)) {
              passedKnown = true;
              if (job.mode === 'NEWER') {
                done = true;
                break;
              }
            }
            if (
              !known.has(id) &&
              !seen.has(id) &&
              (job.mode === 'NEWER' || passedKnown)
            ) {
              selectedIds.push(id);
              seen.add(id);
            }
          }
          const videos = await this.youtube.videos(selectedIds);
          candidates.push(
            ...videos.filter(
              (video) => video.youtubeChannelId === channel.youtubeChannelId,
            ),
          );
          candidates = candidates.slice(0, job.requestedCount);
          const progress = await this.prisma.podcastImportJob.updateMany({
            where,
            data: { scannedCount },
          });
          if (!progress.count) return;
          token = page.nextPageToken;
          if (candidates.length >= job.requestedCount || done) break;
          if (scannedCount >= 5000 || Date.now() - started > 120_000)
            throw new BadRequestException(
              'Phiên lấy video đã đạt giới hạn quét. Hãy thử số lượng nhỏ hơn hoặc thêm bằng URL.',
            );
        } while (token);
      }
      await this.prisma.podcastImportJob.updateMany({
        where,
        data: {
          status: 'READY',
          scannedCount,
          candidatesJson: candidates as unknown as Prisma.InputJsonValue,
          leaseToken: null,
          leaseUntil: null,
        },
      });
      await this.prisma.podcastChannel.update({
        where: { id: channel.id },
        data: { lastSyncedAt: new Date() },
      });
    } catch (error) {
      await this.prisma.podcastImportJob.updateMany({
        where,
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Không lấy được danh sách video.',
          leaseToken: null,
          leaseUntil: null,
        },
      });
    }
  }
}
