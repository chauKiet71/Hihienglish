import { ConfigService } from '@nestjs/config';
import { CefrLevel, SpeakingDialect } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IflytekPronunciationService } from './iflytek-pronunciation.service';
export declare const FREE_SPEAKING_TURNS_PER_DAY = 3;
export declare const MAX_SPEAKING_AUDIO_BYTES: number;
export declare const MAX_SPEAKING_DURATION_MS = 60000;
export declare function resolveGrammarCorrection(transcript: string | null | undefined, correction: string | null | undefined): string | null;
export declare function suggestionCopiesCorrection(suggestion: string, correction: string | null | undefined): boolean;
export declare class SpeakingService {
    private readonly prisma;
    private readonly config;
    private readonly iflytekPronunciation?;
    private readonly logger;
    private openai;
    private catalogPromise;
    private readonly pendingTurnScores;
    constructor(prisma: PrismaService, config: ConfigService, iflytekPronunciation?: IflytekPronunciationService | undefined);
    listScenarios(): Promise<{
        id: string;
        description: string;
        sortOrder: number;
        icon: string;
        title: string;
        objective: string;
        color: string;
        slug: string;
        learnerRole: string;
        aiRole: string;
        minLevel: import("@prisma/client").$Enums.CefrLevel;
        maxLevel: import("@prisma/client").$Enums.CefrLevel;
    }[]>;
    getQuota(userId: string): Promise<{
        used: number;
        limit: number;
        remaining: number | null;
        isPremium: boolean;
        resetsAt: string;
    }>;
    getHistory(userId: string): Promise<{
        stats: {
            totalSessions: number;
            averageScore: number | null;
            streakDays: number;
            practicedTopics: number;
        };
        items: {
            id: string;
            level: import("@prisma/client").$Enums.CefrLevel;
            dialect: import("@prisma/client").$Enums.SpeakingDialect;
            status: import("@prisma/client").$Enums.SpeakingSessionStatus;
            createdAt: Date;
            completedAt: Date | null;
            durationMs: number;
            turnsSpoken: number;
            averageOverall: number | null;
            scenario: {
                id: string;
                description: string;
                sortOrder: number;
                icon: string;
                title: string;
                objective: string;
                color: string;
                slug: string;
                learnerRole: string;
                aiRole: string;
                minLevel: import("@prisma/client").$Enums.CefrLevel;
                maxLevel: import("@prisma/client").$Enums.CefrLevel;
            };
        }[];
    }>;
    createSession(userId: string, scenarioId: string, level: CefrLevel, dialect: SpeakingDialect): Promise<{
        session: {
            id: string;
            level: import("@prisma/client").$Enums.CefrLevel;
            dialect: import("@prisma/client").$Enums.SpeakingDialect;
            status: import("@prisma/client").$Enums.SpeakingSessionStatus;
            turnCount: number;
            createdAt: Date;
            completedAt: Date | null;
            scenario: {
                id: string;
                slug: string;
                title: string;
                description: string;
                icon: string;
                color: string;
                learnerRole: string;
                aiRole: string;
                objective: string;
            };
        };
        turn: {
            id: string;
            turnIndex: number;
            promptText: string;
            transcript: string | null;
            suggestion: string | null;
            feedback: string | null;
            correction: string | null;
            aiReply: string | null;
            scores: {
                pronunciation: number | null;
                fluency: number | null;
                grammar: number | null;
                vocabulary: number | null;
                coherence: number | null;
                overall: number | null;
                relevance: string | null;
                cefrOverall: string | null;
            };
            durationMs: number | null;
            createdAt: Date;
        };
        quota: {
            used: number;
            limit: number;
            remaining: number | null;
            isPremium: boolean;
            resetsAt: string;
        };
    }>;
    getSession(userId: string, sessionId: string): Promise<{
        session: {
            id: string;
            level: import("@prisma/client").$Enums.CefrLevel;
            dialect: import("@prisma/client").$Enums.SpeakingDialect;
            status: import("@prisma/client").$Enums.SpeakingSessionStatus;
            turnCount: number;
            createdAt: Date;
            completedAt: Date | null;
            scenario: {
                id: string;
                slug: string;
                title: string;
                description: string;
                icon: string;
                color: string;
                learnerRole: string;
                aiRole: string;
                objective: string;
            };
        };
        turns: {
            id: string;
            turnIndex: number;
            promptText: string;
            transcript: string | null;
            suggestion: string | null;
            feedback: string | null;
            correction: string | null;
            aiReply: string | null;
            scores: {
                pronunciation: number | null;
                fluency: number | null;
                grammar: number | null;
                vocabulary: number | null;
                coherence: number | null;
                overall: number | null;
                relevance: string | null;
                cefrOverall: string | null;
            };
            durationMs: number | null;
            createdAt: Date;
        }[];
        quota: {
            used: number;
            limit: number;
            remaining: number | null;
            isPremium: boolean;
            resetsAt: string;
        };
    }>;
    submitTurn(userId: string, sessionId: string, file: {
        buffer: Buffer;
        mimetype: string;
        originalname: string;
        size: number;
    }, durationMs?: number): Promise<{
        turn: {
            id: string;
            turnIndex: number;
            promptText: string;
            transcript: string | null;
            suggestion: string | null;
            feedback: string | null;
            correction: string | null;
            aiReply: string | null;
            scores: {
                pronunciation: number | null;
                fluency: number | null;
                grammar: number | null;
                vocabulary: number | null;
                coherence: number | null;
                overall: number | null;
                relevance: string | null;
                cefrOverall: string | null;
            };
            durationMs: number | null;
            createdAt: Date;
        };
        quota: {
            used: number;
            limit: number;
            remaining: number | null;
            isPremium: boolean;
            resetsAt: string;
        };
    }>;
    completeSession(userId: string, sessionId: string): Promise<{
        session: {
            id: string;
            level: import("@prisma/client").$Enums.CefrLevel;
            dialect: import("@prisma/client").$Enums.SpeakingDialect;
            status: import("@prisma/client").$Enums.SpeakingSessionStatus;
            turnCount: number;
            createdAt: Date;
            completedAt: Date | null;
            scenario: {
                id: string;
                slug: string;
                title: string;
                description: string;
                icon: string;
                color: string;
                learnerRole: string;
                aiRole: string;
                objective: string;
            };
        };
        turns: {
            id: string;
            turnIndex: number;
            promptText: string;
            transcript: string | null;
            suggestion: string | null;
            feedback: string | null;
            correction: string | null;
            aiReply: string | null;
            scores: {
                pronunciation: number | null;
                fluency: number | null;
                grammar: number | null;
                vocabulary: number | null;
                coherence: number | null;
                overall: number | null;
                relevance: string | null;
                cefrOverall: string | null;
            };
            durationMs: number | null;
            createdAt: Date;
        }[];
        summary: {
            turnsSpoken: number;
            averageOverall: number | null;
            averagePronunciation: number | null;
            averageFluency: number | null;
            averageGrammar: number | null;
            averageVocabulary: number | null;
            averageCoherence: number | null;
        };
        quota: {
            used: number;
            limit: number;
            remaining: number | null;
            isPremium: boolean;
            resetsAt: string;
        };
    }>;
    private ensureCatalog;
    private resolvePremium;
    private usageDate;
    private nextResetAt;
    private getTodayUsage;
    private assertAndReserveQuota;
    private releaseQuotaReservation;
    private queueTurnScoring;
    private scoreAndPersistTurn;
    private assessSpeakingTurn;
    private buildTurnScores;
    private calculateFluencyScore;
    private transcribeAudio;
    private ensureOpenAi;
    translateToVietnamese(text: string): Promise<{
        translation: string;
    }>;
    private generateAiReply;
    private ensureNextTurnSuggestion;
    private parseSpeakingAssessment;
    private mapSession;
    private mapTurn;
}
