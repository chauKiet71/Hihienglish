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
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const content_catalog_1 = require("../catalog/content-catalog");
const prisma_service_1 = require("../prisma/prisma.service");
let LessonsService = class LessonsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const catalog = (0, content_catalog_1.listCatalogLessons)(params);
        if (catalog.length > 0)
            return catalog;
        const where = {};
        if (params?.featured)
            where.isFeatured = true;
        if (params?.categoryId)
            where.categoryId = params.categoryId;
        return this.prisma.lesson.findMany({
            where,
            include: { category: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const catalog = (0, content_catalog_1.getCatalogLesson)(id);
        if (catalog)
            return catalog;
        const lesson = await this.prisma.lesson.findUnique({
            where: { id },
            include: {
                category: true,
                transcripts: { orderBy: { orderIndex: 'asc' } },
            },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Không tìm thấy bài học');
        }
        return lesson;
    }
    async getHistory(userId, status) {
        const where = { userId };
        if (status && status !== 'all')
            where.status = status.toUpperCase();
        return this.prisma.userLessonHistory.findMany({
            where,
            include: { lesson: { include: { category: true } } },
            orderBy: { lastListenedAt: 'desc' },
        });
    }
    async getHistoryStats(userId) {
        const completedLessons = await this.prisma.userLessonHistory.count({
            where: { userId, status: 'COMPLETED' },
        });
        const histories = await this.prisma.userLessonHistory.findMany({
            where: { userId },
        });
        const lessonsListened = histories.length;
        const hoursListened = histories.reduce((sum, h) => sum + h.listenedSeconds, 0) / 3600;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        return {
            completedLessons,
            lessonsListened,
            hoursListened: Math.round(hoursListened * 10) / 10,
            streakDays: user?.streakDays || 0,
            weeklyGoal: 20,
            weeklyProgress: Math.min(12.6, hoursListened),
        };
    }
    toHistoryEntry(row) {
        return {
            lessonId: row.lessonId,
            status: row.status,
            progress: row.progressPercentage / 100,
            listenedSeconds: row.listenedSeconds,
            lastListenedAt: row.lastListenedAt.toISOString(),
            isFavorite: row.isFavorite,
        };
    }
    async getMyHistoryEntries(userId) {
        const rows = await this.prisma.userLessonHistory.findMany({
            where: { userId },
            orderBy: { lastListenedAt: 'desc' },
        });
        return rows.map((row) => this.toHistoryEntry(row));
    }
    async upsertHistory(userId, dto) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: dto.lessonId },
            select: { id: true },
        });
        if (!lesson)
            return null;
        const progressPercentage = Math.round(Math.min(100, Math.max(0, (dto.progress ?? 0) * 100)));
        const status = dto.status === 'COMPLETED' || dto.status === 'LEARNING'
            ? dto.status
            : undefined;
        const row = await this.prisma.userLessonHistory.upsert({
            where: { userId_lessonId: { userId, lessonId: dto.lessonId } },
            create: {
                userId,
                lessonId: dto.lessonId,
                status: status === 'COMPLETED' ? 'COMPLETED' : 'LEARNING',
                progressPercentage,
                listenedSeconds: dto.listenedSeconds ?? 0,
                isFavorite: dto.isFavorite ?? false,
                lastListenedAt: new Date(),
            },
            update: {
                ...(status ? { status } : {}),
                progressPercentage,
                listenedSeconds: dto.listenedSeconds ?? 0,
                ...(dto.isFavorite === undefined ? {} : { isFavorite: dto.isFavorite }),
                lastListenedAt: new Date(),
            },
        });
        return this.toHistoryEntry(row);
    }
    async getMyFavoriteIds(userId) {
        const [favorites, historyFavs] = await Promise.all([
            this.prisma.userFavorite.findMany({
                where: { userId },
                select: { lessonId: true },
            }),
            this.prisma.userLessonHistory.findMany({
                where: { userId, isFavorite: true },
                select: { lessonId: true },
            }),
        ]);
        return [
            ...new Set([
                ...favorites.map((item) => item.lessonId),
                ...historyFavs.map((item) => item.lessonId),
            ]),
        ];
    }
    async setFavorite(userId, lessonId, favorite) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            select: { id: true },
        });
        if (!lesson)
            return { lessonId, saved: favorite };
        if (favorite) {
            await this.prisma.userFavorite.upsert({
                where: { userId_lessonId: { userId, lessonId } },
                create: { userId, lessonId },
                update: {},
            });
        }
        else {
            await this.prisma.userFavorite.deleteMany({
                where: { userId, lessonId },
            });
        }
        await this.prisma.userLessonHistory.updateMany({
            where: { userId, lessonId },
            data: { isFavorite: favorite },
        });
        return { lessonId, saved: favorite };
    }
};
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map