"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PodcastImportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodcastImportService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const youtube_catalog_service_1 = require("./youtube-catalog.service");
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
};
let PodcastImportService = PodcastImportService_1 = class PodcastImportService {
    prisma;
    youtube;
    logger = new common_1.Logger(PodcastImportService_1.name);
    timer;
    running = false;
    stopped = false;
    constructor(prisma, youtube) {
        this.prisma = prisma;
        this.youtube = youtube;
    }
    onModuleInit() {
        this.timer = setInterval(() => void this.drain(), 2000);
        this.timer.unref();
        void this.drain();
    }
    onModuleDestroy() {
        this.stopped = true;
        clearInterval(this.timer);
    }
    publicJob(row) {
        const { candidatesJson, ...job } = row;
        return {
            ...job,
            mode: job.mode,
            createdAt: row.createdAt.toISOString(),
            candidates: candidatesJson,
        };
    }
    async list(channelId) {
        return (await this.prisma.podcastImportJob.findMany({
            where: { channelId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: jobSelect,
        })).map((row) => this.publicJob(row));
    }
    async get(id) {
        const row = await this.prisma.podcastImportJob.findUnique({
            where: { id },
            select: jobSelect,
        });
        if (!row)
            throw new common_1.NotFoundException('Không tìm thấy phiên nhập video.');
        return this.publicJob(row);
    }
    async create(channelId, mode, requestedCount, videoUrl) {
        if (!this.youtube.configured)
            throw new common_1.ServiceUnavailableException('Chưa cấu hình kết nối YouTube. Quản trị hệ thống cần đặt YOUTUBE_DATA_API_KEY trên máy chủ.');
        if (mode === 'URL' && !videoUrl?.trim())
            throw new common_1.BadRequestException('Vui lòng nhập URL video.');
        const row = await this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw `SELECT 1 FROM pg_advisory_xact_lock(hashtext(${channelId}))`;
            if (!(await tx.podcastChannel.findUnique({ where: { id: channelId } })))
                throw new common_1.NotFoundException('Không tìm thấy kênh.');
            if (await tx.podcastImportJob.findFirst({
                where: { channelId, status: { in: ['QUEUED', 'RUNNING'] } },
            }))
                throw new common_1.ConflictException('Kênh đang có một phiên lấy video. Hãy đợi phiên đó hoàn tất.');
            return tx.podcastImportJob.create({
                data: {
                    channelId,
                    mode,
                    requestedCount: mode === 'URL' ? 1 : requestedCount,
                    videoUrl: mode === 'URL' ? videoUrl : null,
                },
                select: jobSelect,
            });
        }, { maxWait: 15_000, timeout: 20_000 });
        return this.publicJob(row);
    }
    async commit(id, ids) {
        return this.prisma.$transaction(async (tx) => {
            const job = await tx.podcastImportJob.findUnique({ where: { id } });
            if (!job)
                throw new common_1.NotFoundException('Không tìm thấy phiên nhập.');
            await tx.$queryRaw `SELECT 1 FROM pg_advisory_xact_lock(hashtext(${job.channelId}))`;
            if (job.status === 'IMPORTED')
                return this.publicJob(job);
            if (job.status !== 'READY')
                throw new common_1.ConflictException('Phiên nhập chưa sẵn sàng.');
            const candidates = job.candidatesJson;
            const uniqueIds = [...new Set(ids)];
            if (!uniqueIds.length ||
                uniqueIds.some((videoId) => !candidates.some((video) => video.id === videoId)))
                throw new common_1.BadRequestException('Chỉ được chọn video trong danh sách xem trước.');
            const claimed = await tx.podcastImportJob.updateMany({
                where: { id, status: 'READY' },
                data: { status: 'IMPORTING' },
            });
            if (!claimed.count)
                throw new common_1.ConflictException('Phiên nhập đang được xử lý. Hãy tải lại kết quả.');
            const range = await tx.podcastVideo.aggregate({
                where: { channelId: job.channelId },
                _min: { sortOrder: true },
                _max: { sortOrder: true },
            });
            const selected = candidates.filter((video) => uniqueIds.includes(video.id));
            const first = job.mode === 'NEWER'
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
        }, { maxWait: 15_000, timeout: 20_000 });
    }
    async drain() {
        if (this.running || this.stopped)
            return;
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
            if (!job)
                return;
            const leaseToken = (0, crypto_1.randomUUID)();
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
            if (claimed.count)
                await this.scan(job, leaseToken);
        }
        catch {
            this.logger.warn('Chưa xử lý được hàng đợi nhập podcast; sẽ thử lại.');
        }
        finally {
            this.running = false;
        }
    }
    async scan(job, leaseToken) {
        const where = { id: job.id, status: 'RUNNING', leaseToken };
        try {
            const channel = await this.prisma.podcastChannel.findUniqueOrThrow({
                where: { id: job.channelId },
            });
            const known = new Set((await this.prisma.podcastVideo.findMany({ select: { id: true } })).map((video) => video.id));
            const own = new Set((await this.prisma.podcastVideo.findMany({
                where: { channelId: channel.id },
                select: { id: true },
            })).map((video) => video.id));
            let scannedCount = 0;
            let candidates = [];
            if (job.mode === 'URL') {
                const video = await this.youtube.video(job.videoUrl);
                if (video.youtubeChannelId !== channel.youtubeChannelId)
                    throw new common_1.BadRequestException('Video không thuộc kênh đang chọn.');
                if (known.has(video.id))
                    throw new common_1.ConflictException('Video này đã có trong thư viện, kể cả video đang ẩn.');
                candidates = [video];
                scannedCount = 1;
            }
            else {
                const uploads = channel.uploadsPlaylistId ||
                    (await this.youtube.channel(channel.youtubeChannelId))
                        .uploadsPlaylistId;
                if (!channel.uploadsPlaylistId)
                    await this.prisma.podcastChannel.update({
                        where: { id: channel.id },
                        data: { uploadsPlaylistId: uploads },
                    });
                let token;
                let passedKnown = own.size === 0;
                let done = false;
                const started = Date.now();
                const seen = new Set();
                do {
                    if (this.stopped)
                        return;
                    const page = await this.youtube.page(uploads, token);
                    const selectedIds = [];
                    for (const id of page.ids) {
                        scannedCount++;
                        if (own.has(id)) {
                            passedKnown = true;
                            if (job.mode === 'NEWER') {
                                done = true;
                                break;
                            }
                        }
                        if (!known.has(id) &&
                            !seen.has(id) &&
                            (job.mode === 'NEWER' || passedKnown)) {
                            selectedIds.push(id);
                            seen.add(id);
                        }
                    }
                    const videos = await this.youtube.videos(selectedIds);
                    candidates.push(...videos.filter((video) => video.youtubeChannelId === channel.youtubeChannelId));
                    candidates = candidates.slice(0, job.requestedCount);
                    const progress = await this.prisma.podcastImportJob.updateMany({
                        where,
                        data: { scannedCount },
                    });
                    if (!progress.count)
                        return;
                    token = page.nextPageToken;
                    if (candidates.length >= job.requestedCount || done)
                        break;
                    if (scannedCount >= 5000 || Date.now() - started > 120_000)
                        throw new common_1.BadRequestException('Phiên lấy video đã đạt giới hạn quét. Hãy thử số lượng nhỏ hơn hoặc thêm bằng URL.');
                } while (token);
            }
            await this.prisma.podcastImportJob.updateMany({
                where,
                data: {
                    status: 'READY',
                    scannedCount,
                    candidatesJson: candidates,
                    leaseToken: null,
                    leaseUntil: null,
                },
            });
            await this.prisma.podcastChannel.update({
                where: { id: channel.id },
                data: { lastSyncedAt: new Date() },
            });
        }
        catch (error) {
            await this.prisma.podcastImportJob.updateMany({
                where,
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error
                        ? error.message
                        : 'Không lấy được danh sách video.',
                    leaseToken: null,
                    leaseUntil: null,
                },
            });
        }
    }
};
exports.PodcastImportService = PodcastImportService;
exports.PodcastImportService = PodcastImportService = PodcastImportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        youtube_catalog_service_1.YoutubeCatalogService])
], PodcastImportService);
//# sourceMappingURL=podcast-import.service.js.map