import { ReviewSavedVocabularyDto, SaveVocabularyDto, SavedVocabularyQueryDto } from './dto/saved-vocabulary.dto';
import { SavedVocabularyService } from './saved-vocabulary.service';
export declare class SavedVocabularyController {
    private readonly service;
    constructor(service: SavedVocabularyService);
    list(user: {
        id: string;
    }, query: SavedVocabularyQueryDto): Promise<{
        words: {
            id: string;
            word: string;
            meaning: string;
            phonetic: string | null;
            partOfSpeech: string | null;
            definition: string | null;
            status: import("@prisma/client").$Enums.VocabularyProgressStatus;
            reviewCount: number;
            correctCount: number;
            streak: number;
            lapses: number;
            intervalDays: number;
            easeFactor: number;
            nextReviewAt: Date;
            lastReviewedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            sources: import("@prisma/client").SavedVocabularySource[];
        }[];
        stats: {
            total: number;
            mastered: number;
            due: number;
        };
        sources: {
            key: string;
            title: string;
        }[];
    }>;
    session(user: {
        id: string;
    }, query: SavedVocabularyQueryDto): Promise<{
        words: {
            id: string;
            word: string;
            meaning: string;
            phonetic: string | null;
            partOfSpeech: string | null;
            definition: string | null;
            status: import("@prisma/client").$Enums.VocabularyProgressStatus;
            reviewCount: number;
            correctCount: number;
            streak: number;
            lapses: number;
            intervalDays: number;
            easeFactor: number;
            nextReviewAt: Date;
            lastReviewedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            sources: import("@prisma/client").SavedVocabularySource[];
        }[];
    }>;
    save(user: {
        id: string;
    }, dto: SaveVocabularyDto): Promise<{
        id: string;
        word: string;
        meaning: string;
        phonetic: string | null;
        partOfSpeech: string | null;
        definition: string | null;
        status: import("@prisma/client").$Enums.VocabularyProgressStatus;
        reviewCount: number;
        correctCount: number;
        streak: number;
        lapses: number;
        intervalDays: number;
        easeFactor: number;
        nextReviewAt: Date;
        lastReviewedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        sources: import("@prisma/client").SavedVocabularySource[];
    }>;
    remove(user: {
        id: string;
    }, id: string): Promise<{
        removed: boolean;
    }>;
    review(user: {
        id: string;
    }, id: string, dto: ReviewSavedVocabularyDto): Promise<{
        id: string;
        word: string;
        meaning: string;
        phonetic: string | null;
        partOfSpeech: string | null;
        definition: string | null;
        status: import("@prisma/client").$Enums.VocabularyProgressStatus;
        reviewCount: number;
        correctCount: number;
        streak: number;
        lapses: number;
        intervalDays: number;
        easeFactor: number;
        nextReviewAt: Date;
        lastReviewedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        sources: import("@prisma/client").SavedVocabularySource[];
    }>;
    replay(user: {
        id: string;
    }, id: string, sourceId: string): Promise<{
        href: string;
    }>;
}
