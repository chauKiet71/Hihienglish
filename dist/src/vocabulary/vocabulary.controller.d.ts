import { LearnVocabularyWordDto, LookupVocabularyWordDto, ReviewVocabularyWordDto } from './dto/vocabulary.dto';
import { VocabularyService } from './vocabulary.service';
export declare class VocabularyController {
    private readonly vocabularyService;
    constructor(vocabularyService: VocabularyService);
    getOverview(user: {
        id: string;
    } | null): Promise<{
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
    getLearnSession(user: {
        id: string;
    }, setId?: string, limit?: string): Promise<{
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
    getReviewSession(user: {
        id: string;
    }, setId?: string, limit?: string): Promise<{
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
    getSets(user: {
        id: string;
    } | null): Promise<{
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
    getSet(user: {
        id: string;
    } | null, id: string): Promise<{
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
    saveSet(user: {
        id: string;
    }, id: string): Promise<{
        saved: boolean;
    }>;
    removeSet(user: {
        id: string;
    }, id: string): Promise<{
        saved: boolean;
    }>;
    learnWord(user: {
        id: string;
    }, dto: LearnVocabularyWordDto): Promise<{
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
    lookupWord(user: {
        id: string;
    } | null, dto: LookupVocabularyWordDto): Promise<({
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
    reviewWord(user: {
        id: string;
    }, id: string, dto: ReviewVocabularyWordDto): Promise<{
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
}
