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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PodcastAccessService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const podcast_catalog_service_1 = require("./podcast-catalog.service");
let PodcastAccessService = class PodcastAccessService {
    prisma;
    catalog;
    constructor(prisma, catalog) {
        this.prisma = prisma;
        this.catalog = catalog;
    }
    async getAccessMap() {
        const rows = await this.prisma.podcastAccess.findMany({
            select: { videoId: true, isPremium: true, previewSeconds: true },
        });
        const ids = new Set((await this.catalog.list()).flatMap((channel) => channel.videos.map((video) => video.id)));
        return Object.fromEntries(rows
            .filter((row) => ids.has(row.videoId))
            .map((row) => [row.videoId, row]));
    }
    async getPlaybackAccess(videoId, viewer) {
        const video = await this.catalog.findVideo(videoId);
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
        const premium = viewer?.isPremium === true &&
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
    async setAccess(videoId, isPremium, previewSeconds) {
        const video = await this.catalog.findVideo(videoId, true);
        if (typeof isPremium !== 'boolean' ||
            !Number.isInteger(previewSeconds) ||
            previewSeconds < 0 ||
            previewSeconds >= video.duration ||
            previewSeconds > 86399) {
            throw new common_1.BadRequestException('Thời gian nghe thử phải là số giây nguyên, từ 0 và ngắn hơn thời lượng video.');
        }
        return this.prisma.podcastAccess.upsert({
            where: { videoId },
            create: { videoId, isPremium, previewSeconds },
            update: { isPremium, previewSeconds },
            select: { videoId: true, isPremium: true, previewSeconds: true },
        });
    }
};
exports.PodcastAccessService = PodcastAccessService;
exports.PodcastAccessService = PodcastAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        podcast_catalog_service_1.PodcastCatalogService])
], PodcastAccessService);
//# sourceMappingURL=podcast-access.service.js.map