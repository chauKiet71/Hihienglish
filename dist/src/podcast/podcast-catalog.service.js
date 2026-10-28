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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodcastCatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const podcast_1 = require("../catalog/podcast");
const volka_videos_1 = require("../catalog/volka-videos");
const youtube_catalog_service_1 = require("./youtube-catalog.service");
const fs_1 = require("fs");
const path_1 = require("path");
const public_catalog_cache_service_1 = require("../public-cache/public-catalog-cache.service");
const public_catalog_keys_1 = require("../public-cache/public-catalog.keys");
let PodcastCatalogService = class PodcastCatalogService {
    prisma;
    youtube;
    cache;
    constructor(prisma, youtube, cache) {
        this.prisma = prisma;
        this.youtube = youtube;
        this.cache = cache;
    }
    async onModuleInit() {
        const seeds = [
            {
                ...volka_videos_1.VOLKA_CHANNEL,
                id: 'volka-english',
                channelId: 'UCcvjK35lDPZTlkIrrwxpepg',
                description: '',
                videos: volka_videos_1.VOLKA_VIDEOS,
            },
            ...podcast_1.PODCAST_CHANNELS,
        ];
        let seeded = false;
        await this.prisma.$transaction(async (tx) => {
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
                data: seeds.flatMap((channel) => channel.videos.map((video, sortOrder) => ({
                    id: video.id,
                    channelId: channel.id,
                    title: video.title,
                    duration: video.duration,
                    sortOrder,
                    transcriptStatus: (0, fs_1.existsSync)((0, path_1.join)(process.cwd(), 'storage', 'featured-videos', video.id, 'transcript-v3.json')) ||
                        (0, fs_1.existsSync)((0, path_1.join)(process.cwd(), 'storage', 'featured-videos', video.id, 'transcript-v2.json'))
                        ? 'READY'
                        : 'PENDING',
                    publishedAt: 'publishedAt' in video
                        ? new Date(video.publishedAt)
                        : null,
                }))),
                skipDuplicates: true,
            });
            seeded = !!(channels?.count || videos?.count);
        }, { maxWait: 15_000, timeout: 20_000 });
        if (seeded)
            await this.cache?.invalidate(public_catalog_keys_1.PublicCatalogKeys.podcasts);
    }
    async list(admin = false) {
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
    publicVideo(video, channel) {
        return {
            id: video.id,
            title: video.title,
            duration: video.duration,
            isVisible: video.isVisible,
            transcriptStatus: video.transcriptStatus,
            publishedAt: video.publishedAt?.toISOString() || null,
            channelName: channel.name,
            channelId: channel.id,
            lessonPath: channel.id === 'volka-english'
                ? `/kenh/volka-english/video/${video.id}`
                : `/podcast?channel=${encodeURIComponent(channel.id)}&v=${video.id}`,
        };
    }
    async findVideo(id, admin = false) {
        const video = await this.prisma.podcastVideo.findFirst({
            where: {
                id,
                ...(admin ? {} : { isVisible: true, channel: { isVisible: true } }),
            },
            include: { channel: true },
        });
        if (!video)
            throw new common_1.NotFoundException('Không tìm thấy podcast này hoặc video đã được ẩn.');
        return this.publicVideo(video, video.channel);
    }
    async addChannel(url) {
        const data = await this.youtube.channel(url);
        if (await this.prisma.podcastChannel.findUnique({
            where: { youtubeChannelId: data.youtubeChannelId },
        }))
            throw new common_1.ConflictException('Kênh này đã có trong danh sách.');
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
            await this.cache?.invalidate(public_catalog_keys_1.PublicCatalogKeys.podcasts);
            return channel;
        }
        catch (error) {
            if (error.code === 'P2002')
                throw new common_1.ConflictException('Kênh này đã có trong danh sách.');
            throw error;
        }
    }
    async setChannelVisible(id, isVisible) {
        if (!(await this.prisma.podcastChannel.findUnique({ where: { id } })))
            throw new common_1.NotFoundException('Không tìm thấy kênh.');
        const channel = await this.prisma.podcastChannel.update({
            where: { id },
            data: { isVisible },
        });
        await this.cache?.invalidate(public_catalog_keys_1.PublicCatalogKeys.podcasts);
        return channel;
    }
    async setVideoVisible(id, isVisible) {
        await this.findVideo(id, true);
        const video = await this.prisma.podcastVideo.update({
            where: { id },
            data: { isVisible },
        });
        await this.cache?.invalidate(public_catalog_keys_1.PublicCatalogKeys.podcasts);
        return video;
    }
    async setTranscriptStatus(id, status) {
        const updated = await this.prisma.podcastVideo.updateMany({
            where: { id, transcriptStatus: { not: status } },
            data: { transcriptStatus: status },
        });
        if (updated?.count)
            await this.cache?.invalidate(public_catalog_keys_1.PublicCatalogKeys.podcasts);
    }
};
exports.PodcastCatalogService = PodcastCatalogService;
exports.PodcastCatalogService = PodcastCatalogService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        youtube_catalog_service_1.YoutubeCatalogService,
        public_catalog_cache_service_1.PublicCatalogCacheService])
], PodcastCatalogService);
//# sourceMappingURL=podcast-catalog.service.js.map