import { type SavedVocabularySource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FeaturedVideoService } from '../video-translate/featured-video.service';
import { ReviewSavedVocabularyDto, SaveVocabularyDto, SavedVocabularyQueryDto, VocabularySourceDto } from './dto/saved-vocabulary.dto';
export declare class SavedVocabularyService {
    private readonly prisma;
    private readonly featured;
    constructor(prisma: PrismaService, featured: FeaturedVideoService);
    private where;
    private publicWord;
    list(userId: string, query?: SavedVocabularyQueryDto): Promise<{
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
            sources: SavedVocabularySource[];
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
    session(userId: string, query?: SavedVocabularyQueryDto): Promise<{
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
            sources: SavedVocabularySource[];
        }[];
    }>;
    resolveSource(userId: string, source: VocabularySourceDto): Promise<{
        title: string;
        sentence: string;
        sentenceTranslation: string;
        startTime: number;
        endTime: number;
    }>;
    save(userId: string, dto: SaveVocabularyDto): Promise<{
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
        sources: SavedVocabularySource[];
    }>;
    remove(userId: string, id: string): Promise<{
        removed: boolean;
    }>;
    review(userId: string, id: string, dto: ReviewSavedVocabularyDto): Promise<{
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
        sources: SavedVocabularySource[];
    }>;
    replay(userId: string, id: string, sourceId: string): Promise<{
        href: string;
    }>;
}
