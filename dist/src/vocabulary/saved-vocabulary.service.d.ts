import { type SavedVocabularySource } from '@prisma/client';
import { PodcastCatalogService } from '../podcast/podcast-catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { FeaturedVideoService } from '../video-translate/featured-video.service';
import { ReviewSavedVocabularyDto, SaveVocabularyDto, SavedVocabularyQueryDto, VocabularySourceDto } from './dto/saved-vocabulary.dto';
export declare class SavedVocabularyService {
    private readonly prisma;
    private readonly featured;
    private readonly catalog;
    constructor(prisma: PrismaService, featured: FeaturedVideoService, catalog: PodcastCatalogService);
    private where;
    private publicWord;
    list(userId: string, query?: SavedVocabularyQueryDto): Promise<{
        words: {
            id: string;
            status: import("@prisma/client").$Enums.VocabularyProgressStatus;
            createdAt: Date;
            updatedAt: Date;
            word: string;
            lastReviewedAt: Date | null;
            nextReviewAt: Date;
            phonetic: string | null;
            meaning: string;
            reviewCount: number;
            correctCount: number;
            streak: number;
            lapses: number;
            intervalDays: number;
            easeFactor: number;
            partOfSpeech: string | null;
            definition: string | null;
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
            status: import("@prisma/client").$Enums.VocabularyProgressStatus;
            createdAt: Date;
            updatedAt: Date;
            word: string;
            lastReviewedAt: Date | null;
            nextReviewAt: Date;
            phonetic: string | null;
            meaning: string;
            reviewCount: number;
            correctCount: number;
            streak: number;
            lapses: number;
            intervalDays: number;
            easeFactor: number;
            partOfSpeech: string | null;
            definition: string | null;
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
        status: import("@prisma/client").$Enums.VocabularyProgressStatus;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        lastReviewedAt: Date | null;
        nextReviewAt: Date;
        phonetic: string | null;
        meaning: string;
        reviewCount: number;
        correctCount: number;
        streak: number;
        lapses: number;
        intervalDays: number;
        easeFactor: number;
        partOfSpeech: string | null;
        definition: string | null;
        sources: SavedVocabularySource[];
    }>;
    remove(userId: string, id: string): Promise<{
        removed: boolean;
    }>;
    review(userId: string, id: string, dto: ReviewSavedVocabularyDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.VocabularyProgressStatus;
        createdAt: Date;
        updatedAt: Date;
        word: string;
        lastReviewedAt: Date | null;
        nextReviewAt: Date;
        phonetic: string | null;
        meaning: string;
        reviewCount: number;
        correctCount: number;
        streak: number;
        lapses: number;
        intervalDays: number;
        easeFactor: number;
        partOfSpeech: string | null;
        definition: string | null;
        sources: SavedVocabularySource[];
    }>;
    replay(userId: string, id: string, sourceId: string): Promise<{
        href: string;
    }>;
}
