import { PrismaService } from '../prisma/prisma.service';
export declare class LessonsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(params?: {
        featured?: boolean;
        categoryId?: string;
    }): Promise<{
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
    toHistoryEntry(row: {
        lessonId: string;
        status: string;
        progressPercentage: number;
        listenedSeconds: number;
        lastListenedAt: Date;
        isFavorite: boolean;
    }): {
        lessonId: string;
        status: string;
        progress: number;
        listenedSeconds: number;
        lastListenedAt: string;
        isFavorite: boolean;
    };
    getMyHistoryEntries(userId: string): Promise<{
        lessonId: string;
        status: string;
        progress: number;
        listenedSeconds: number;
        lastListenedAt: string;
        isFavorite: boolean;
    }[]>;
    upsertHistory(userId: string, dto: {
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
    getMyFavoriteIds(userId: string): Promise<string[]>;
    setFavorite(userId: string, lessonId: string, favorite: boolean): Promise<{
        lessonId: string;
        saved: boolean;
    }>;
}
