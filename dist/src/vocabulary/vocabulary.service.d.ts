import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { LookupVocabularyWordDto } from './dto/vocabulary.dto';
export declare class VocabularyService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    private catalogSync;
    private readonly lookupRequests;
    private readonly lookupDetailCache;
    private openai;
    constructor(prisma: PrismaService, config: ConfigService);
    private publicProgress;
    private mapDueWord;
    private normalizeLookupWord;
    private lookupCandidates;
    private ensureCatalog;
    private syncCatalog;
    getOverview(userId?: string): Promise<{
        stats: {
            totalLearned: number;
            mastered: number;
            learning: number;
            dueCount: number;
            learnedToday: number;
        };
        sets: {
            id: string;
            slug: string;
            title: string;
            description: string;
            icon: string;
            color: string;
            cefrLevel: import("@prisma/client").$Enums.CefrLevel;
            topic: string;
            isFeatured: boolean;
            wordCount: number;
            learnedCount: number;
            saved: boolean;
        }[];
        mySets: {
            id: string;
            slug: string;
            title: string;
            description: string;
            icon: string;
            color: string;
            cefrLevel: import("@prisma/client").$Enums.CefrLevel;
            topic: string;
            wordCount: number;
            learnedCount: number;
            saved: boolean;
        }[];
        dueWords: {
            setTitle: string;
            progress: {
                id: string | undefined;
                status: import("@prisma/client").$Enums.VocabularyProgressStatus;
                reviewCount: number;
                correctCount: number;
                streak: number;
                lapses: number;
                intervalDays: number;
                easeFactor: number;
                lastReviewedAt: Date | null;
                nextReviewAt: Date;
            };
            id: string;
            setId: string;
            word: string;
            phonetic: string | null;
            meaning: string;
            example: string;
            exampleTranslation: string;
            audioUrl: string | null;
            sortOrder: number;
            createdAt: Date;
        }[];
    }>;
    private withSavedWord;
    lookupWord(userId: string | undefined, input: LookupVocabularyWordDto): Promise<({
        id: string;
        requestedWord: string;
        word: string;
        phonetic: string | null;
        partOfSpeech: string | null;
        meaning: string;
        definition: string;
        example: string;
        exampleTranslation: string;
        audioUrl: string | null;
        synonyms: string[];
        relatedWords: {
            word: string;
            note: string;
        }[];
        source: "catalog";
    } & {
        savedWordId: string | null;
        savedSourceKeys: string[];
        progress: {
            id: string | undefined;
            status: import("@prisma/client").$Enums.VocabularyProgressStatus;
            reviewCount: number;
            correctCount: number;
            streak: number;
            lapses: number;
            intervalDays: number;
            easeFactor: number;
            lastReviewedAt: Date | null;
            nextReviewAt: Date;
        } | null;
    }) | ({
        audioUrl: null;
        source: "generated";
        word: string;
        phonetic: string | null;
        partOfSpeech: string | null;
        meaning: string;
        definition: string;
        example: string;
        exampleTranslation: string;
        synonyms: string[];
        relatedWords: Array<{
            word: string;
            note: string;
        }>;
        id: string;
        requestedWord: string;
    } & {
        savedWordId: string | null;
        savedSourceKeys: string[];
        progress: {
            id: string | undefined;
            status: import("@prisma/client").$Enums.VocabularyProgressStatus;
            reviewCount: number;
            correctCount: number;
            streak: number;
            lapses: number;
            intervalDays: number;
            easeFactor: number;
            lastReviewedAt: Date | null;
            nextReviewAt: Date;
        } | null;
    })>;
    private getGeneratedWordDetail;
    private generateWordDetail;
    getSets(userId?: string): Promise<{
        id: string;
        slug: string;
        title: string;
        description: string;
        icon: string;
        color: string;
        cefrLevel: import("@prisma/client").$Enums.CefrLevel;
        topic: string;
        isFeatured: boolean;
        wordCount: number;
        learnedCount: number;
        saved: boolean;
    }[]>;
    getSet(userId: string | undefined, id: string): Promise<{
        saved: boolean;
        words: {
            progress: null;
            id: string;
            createdAt: Date;
            sortOrder: number;
            audioUrl: string | null;
            word: string;
            example: string;
            setId: string;
            phonetic: string | null;
            meaning: string;
            exampleTranslation: string;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        sortOrder: number;
        icon: string;
        title: string;
        topic: string;
        isFeatured: boolean;
        color: string;
        slug: string;
        cefrLevel: import("@prisma/client").$Enums.CefrLevel;
    } | {
        saved: boolean;
        words: {
            progress: {
                id: string;
                status: import("@prisma/client").$Enums.VocabularyProgressStatus;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                wordId: string;
                lastReviewedAt: Date | null;
                nextReviewAt: Date;
                reviewCount: number;
                correctCount: number;
                streak: number;
                lapses: number;
                intervalDays: number;
                easeFactor: number;
                learnedAt: Date;
            };
            id: string;
            createdAt: Date;
            sortOrder: number;
            audioUrl: string | null;
            word: string;
            example: string;
            setId: string;
            phonetic: string | null;
            meaning: string;
            exampleTranslation: string;
        }[];
        savedBy: {
            id: string;
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        sortOrder: number;
        icon: string;
        title: string;
        topic: string;
        isFeatured: boolean;
        color: string;
        slug: string;
        cefrLevel: import("@prisma/client").$Enums.CefrLevel;
    }>;
    saveSet(userId: string, setId: string): Promise<{
        saved: boolean;
    }>;
    removeSet(userId: string, setId: string): Promise<{
        saved: boolean;
    }>;
    learnWord(userId: string, wordId: string, correct?: boolean): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.VocabularyProgressStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        wordId: string;
        lastReviewedAt: Date | null;
        nextReviewAt: Date;
        reviewCount: number;
        correctCount: number;
        streak: number;
        lapses: number;
        intervalDays: number;
        easeFactor: number;
        learnedAt: Date;
    }>;
    reviewWord(userId: string, wordId: string, correct: boolean): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.VocabularyProgressStatus;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        wordId: string;
        lastReviewedAt: Date | null;
        nextReviewAt: Date;
        reviewCount: number;
        correctCount: number;
        streak: number;
        lapses: number;
        intervalDays: number;
        easeFactor: number;
        learnedAt: Date;
    }>;
    getLearnSession(userId: string, query?: {
        setId?: string;
        limit?: number;
    }): Promise<{
        type: "learn";
        setId: null;
        setTitle: null;
        remainingNewCount: number;
        dueCount: number;
        words: never[];
    } | {
        type: "learn";
        setId: string;
        setTitle: string;
        remainingNewCount: number;
        dueCount: number;
        words: {
            setTitle: string;
            progress: null;
            id: string;
            createdAt: Date;
            sortOrder: number;
            audioUrl: string | null;
            word: string;
            example: string;
            setId: string;
            phonetic: string | null;
            meaning: string;
            exampleTranslation: string;
        }[];
    }>;
    getReviewSession(userId: string, query?: {
        setId?: string;
        limit?: number;
    }): Promise<{
        type: "review";
        setId: string | null;
        setTitle: string;
        remainingNewCount: number;
        dueCount: number;
        words: {
            setTitle: string;
            progress: {
                id: string | undefined;
                status: import("@prisma/client").$Enums.VocabularyProgressStatus;
                reviewCount: number;
                correctCount: number;
                streak: number;
                lapses: number;
                intervalDays: number;
                easeFactor: number;
                lastReviewedAt: Date | null;
                nextReviewAt: Date;
            };
            id: string;
            setId: string;
            word: string;
            phonetic: string | null;
            meaning: string;
            example: string;
            exampleTranslation: string;
            audioUrl: string | null;
            sortOrder: number;
            createdAt: Date;
        }[];
    }>;
    private pickSetWithNewWords;
}
