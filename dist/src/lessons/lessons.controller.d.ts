import { LessonsService } from './lessons.service';
import { LessonAccessService } from './lesson-access.service';
import { UpdateLessonAccessDto } from './dto/update-lesson-access.dto';
import { PublicCatalogCacheService } from '../public-cache/public-catalog-cache.service';
export declare class LessonsController {
    private lessonsService;
    private lessonAccessService;
    private cache?;
    constructor(lessonsService: LessonsService, lessonAccessService: LessonAccessService, cache?: PublicCatalogCacheService | undefined);
    getAccessMap(): Promise<Record<string, boolean>>;
    setAccess(lessonId: string, dto: UpdateLessonAccessDto): Promise<{
        updatedAt: Date;
        lessonId: string;
        isLocked: boolean;
    }>;
    findAll(featured?: string, categoryId?: string): Promise<{
        id: string;
        title: string;
        description: string;
        thumbnailUrl: string;
        audioUrl: string;
        duration: number;
        level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
        topic: string;
        categoryId: string;
        isFeatured: boolean;
        isNew: boolean;
        isHot: boolean;
        category: {
            id: string;
            name: string;
            icon: string;
            iconColor: string;
            imageUrl: string;
            lessonCount: number;
        } | null;
    }[] | ({
        category: {
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            icon: string;
            iconColor: string;
            imageUrl: string | null;
            lessonCount: number;
            isPopular: boolean;
        } | null;
    } & {
        id: string;
        level: import("@prisma/client").$Enums.LessonLevel;
        createdAt: Date;
        description: string | null;
        duration: number;
        categoryId: string | null;
        title: string;
        audioUrl: string | null;
        videoUrl: string | null;
        thumbnailUrl: string | null;
        topic: string | null;
        isFeatured: boolean;
        isNew: boolean;
        isHot: boolean;
    })[]>;
    getMyStats(user: {
        id: string;
    }): Promise<{
        completedLessons: number;
        lessonsListened: number;
        hoursListened: number;
        streakDays: number;
        weeklyGoal: number;
        weeklyProgress: number;
    }>;
    getMyHistory(user: {
        id: string;
    }): Promise<{
        lessonId: string;
        status: string;
        progress: number;
        listenedSeconds: number;
        lastListenedAt: string;
        isFavorite: boolean;
    }[]>;
    upsertMyHistory(user: {
        id: string;
    }, dto: {
        lessonId: string;
        status?: string;
        progress?: number;
        listenedSeconds?: number;
        isFavorite?: boolean;
    }): Promise<{
        lessonId: string;
        status: string;
        progress: number;
        listenedSeconds: number;
        lastListenedAt: string;
        isFavorite: boolean;
    } | null>;
    getMyFavorites(user: {
        id: string;
    }): Promise<string[]>;
    saveFavorite(user: {
        id: string;
    }, lessonId: string): Promise<{
        lessonId: string;
        saved: boolean;
    }>;
    removeFavorite(user: {
        id: string;
    }, lessonId: string): Promise<{
        lessonId: string;
        saved: boolean;
    }>;
    getHistory(userId: string, status?: string): Promise<({
        lesson: {
            category: {
                id: string;
                createdAt: Date;
                name: string;
                description: string | null;
                icon: string;
                iconColor: string;
                imageUrl: string | null;
                lessonCount: number;
                isPopular: boolean;
            } | null;
        } & {
            id: string;
            level: import("@prisma/client").$Enums.LessonLevel;
            createdAt: Date;
            description: string | null;
            duration: number;
            categoryId: string | null;
            title: string;
            audioUrl: string | null;
            videoUrl: string | null;
            thumbnailUrl: string | null;
            topic: string | null;
            isFeatured: boolean;
            isNew: boolean;
            isHot: boolean;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.HistoryStatus;
        lessonId: string;
        userId: string;
        progressPercentage: number;
        listenedSeconds: number;
        isFavorite: boolean;
        lastListenedAt: Date;
    })[]>;
    getHistoryStats(userId: string): Promise<{
        completedLessons: number;
        lessonsListened: number;
        hoursListened: number;
        streakDays: number;
        weeklyGoal: number;
        weeklyProgress: number;
    }>;
    findOne(id: string): Promise<{
        transcripts: {
            id: string;
            orderIndex: number;
            englishText: string;
            vietnamese: string;
            startTime: number;
            endTime: number;
            phonetic: string;
            words: {
                text: string;
                start: number;
                end: number;
            }[];
        }[];
        id: string;
        title: string;
        description: string;
        thumbnailUrl: string;
        audioUrl: string;
        duration: number;
        level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
        topic: string;
        categoryId: string;
        isFeatured: boolean;
        isNew: boolean;
        isHot: boolean;
        category: {
            id: string;
            name: string;
            icon: string;
            iconColor: string;
            imageUrl: string;
            lessonCount: number;
        } | null;
    } | ({
        category: {
            id: string;
            createdAt: Date;
            name: string;
            description: string | null;
            icon: string;
            iconColor: string;
            imageUrl: string | null;
            lessonCount: number;
            isPopular: boolean;
        } | null;
        transcripts: {
            id: string;
            orderIndex: number;
            lessonId: string;
            englishText: string;
            vietnamese: string;
            startTime: number;
            endTime: number;
        }[];
    } & {
        id: string;
        level: import("@prisma/client").$Enums.LessonLevel;
        createdAt: Date;
        description: string | null;
        duration: number;
        categoryId: string | null;
        title: string;
        audioUrl: string | null;
        videoUrl: string | null;
        thumbnailUrl: string | null;
        topic: string | null;
        isFeatured: boolean;
        isNew: boolean;
        isHot: boolean;
    })>;
}
