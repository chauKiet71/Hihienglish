"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SpeakingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeakingService = exports.MAX_SPEAKING_DURATION_MS = exports.MAX_SPEAKING_AUDIO_BYTES = exports.FREE_SPEAKING_TURNS_PER_DAY = void 0;
exports.resolveGrammarCorrection = resolveGrammarCorrection;
exports.suggestionCopiesCorrection = suggestionCopiesCorrection;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const openai_1 = __importStar(require("openai"));
const prisma_service_1 = require("../prisma/prisma.service");
const iflytek_pronunciation_service_1 = require("./iflytek-pronunciation.service");
const speaking_scenarios_1 = require("./speaking-scenarios");
exports.FREE_SPEAKING_TURNS_PER_DAY = 3;
exports.MAX_SPEAKING_AUDIO_BYTES = 3.8 * 1024 * 1024;
exports.MAX_SPEAKING_DURATION_MS = 60_000;
function normalizeSpokenText(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9'\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function resolveGrammarCorrection(transcript, correction) {
    const cleaned = correction?.trim() ?? '';
    if (!cleaned || !transcript?.trim())
        return null;
    if (normalizeSpokenText(cleaned) === normalizeSpokenText(transcript)) {
        return null;
    }
    return cleaned;
}
function suggestionCopiesCorrection(suggestion, correction) {
    const normalizedSuggestion = normalizeSpokenText(suggestion);
    const normalizedCorrection = normalizeSpokenText(correction ?? '');
    if (!normalizedSuggestion || !normalizedCorrection)
        return false;
    const correctionWords = normalizedCorrection.split(' ');
    if (correctionWords.length < 2)
        return false;
    return (normalizedSuggestion === normalizedCorrection ||
        normalizedSuggestion.startsWith(`${normalizedCorrection} `));
}
const LEVEL_GUIDANCE = {
    A1: 'Use only A1 vocabulary and very short present-tense sentences.',
    A2: 'Use A2 vocabulary and simple past/present. Keep sentences short and clear.',
    B1: 'Use B1 vocabulary. Mix tenses naturally and ask practical follow-ups.',
    B2: 'Use B2 vocabulary and clearer arguments while staying conversational.',
    C1: 'Use C1 vocabulary and nuanced phrasing, still natural and concise.',
    C2: 'Use C2 vocabulary and near-native fluency without sounding academic.',
};
let SpeakingService = SpeakingService_1 = class SpeakingService {
    prisma;
    config;
    iflytekPronunciation;
    logger = new common_1.Logger(SpeakingService_1.name);
    openai = null;
    catalogPromise = null;
    pendingTurnScores = new Map();
    constructor(prisma, config, iflytekPronunciation) {
        this.prisma = prisma;
        this.config = config;
        this.iflytekPronunciation = iflytekPronunciation;
        const apiKey = this.config.get('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new openai_1.default({ apiKey });
        }
        else {
            this.logger.warn('OPENAI_API_KEY chưa cấu hình — luyện nói sẽ không tạo được phản hồi AI');
        }
    }
    async listScenarios() {
        await this.ensureCatalog();
        return this.prisma.speakingScenario.findMany({
            where: { isVisible: true },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                icon: true,
                color: true,
                learnerRole: true,
                aiRole: true,
                objective: true,
                minLevel: true,
                maxLevel: true,
                sortOrder: true,
            },
        });
    }
    async getQuota(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { isPremium: true, premiumExpiresAt: true },
        });
        const isPremium = this.resolvePremium(user);
        const usage = await this.getTodayUsage(userId);
        return {
            used: usage,
            limit: exports.FREE_SPEAKING_TURNS_PER_DAY,
            remaining: isPremium
                ? null
                : Math.max(0, exports.FREE_SPEAKING_TURNS_PER_DAY - usage),
            isPremium,
            resetsAt: this.nextResetAt().toISOString(),
        };
    }
    async getHistory(userId) {
        await this.ensureCatalog();
        const sessions = await this.prisma.speakingSession.findMany({
            where: {
                userId,
                turnCount: { gt: 0 },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                scenario: {
                    select: {
                        id: true,
                        slug: true,
                        title: true,
                        description: true,
                        icon: true,
                        color: true,
                        learnerRole: true,
                        aiRole: true,
                        objective: true,
                        minLevel: true,
                        maxLevel: true,
                        sortOrder: true,
                    },
                },
                turns: {
                    orderBy: { turnIndex: 'asc' },
                    select: {
                        transcript: true,
                        durationMs: true,
                        overall: true,
                    },
                },
            },
        });
        const items = sessions.map((session) => {
            const spokenTurns = session.turns.filter((turn) => turn.transcript);
            const scores = spokenTurns
                .map((turn) => turn.overall)
                .filter((score) => typeof score === 'number');
            const averageOverall = scores.length
                ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
                : null;
            return {
                id: session.id,
                level: session.level,
                dialect: session.dialect,
                status: session.status,
                createdAt: session.createdAt,
                completedAt: session.completedAt,
                durationMs: spokenTurns.reduce((total, turn) => total + (turn.durationMs ?? 0), 0),
                turnsSpoken: spokenTurns.length,
                averageOverall,
                scenario: session.scenario,
            };
        });
        const allScores = items
            .map((item) => item.averageOverall)
            .filter((score) => typeof score === 'number');
        const averageScore = allScores.length
            ? Math.round(allScores.reduce((total, score) => total + score, 0) /
                allScores.length)
            : null;
        const practicedDays = new Set(items.map((item) => item.createdAt.toISOString().slice(0, 10)));
        const toDayKey = (date) => date.toISOString().slice(0, 10);
        const cursor = new Date();
        cursor.setUTCHours(0, 0, 0, 0);
        if (!practicedDays.has(toDayKey(cursor))) {
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }
        let streakDays = 0;
        while (practicedDays.has(toDayKey(cursor))) {
            streakDays += 1;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }
        return {
            stats: {
                totalSessions: items.length,
                averageScore,
                streakDays,
                practicedTopics: new Set(items.map((item) => item.scenario.id)).size,
            },
            items,
        };
    }
    async createSession(userId, scenarioId, level, dialect) {
        this.ensureOpenAi();
        await this.ensureCatalog();
        const scenario = await this.prisma.speakingScenario.findFirst({
            where: { id: scenarioId, isVisible: true },
        });
        if (!scenario) {
            throw new common_1.NotFoundException('Không tìm thấy tình huống luyện nói');
        }
        const opening = await this.generateAiReply({
            scenarioTitle: scenario.title,
            learnerRole: scenario.learnerRole,
            aiRole: scenario.aiRole,
            objective: scenario.objective,
            openingHint: scenario.openingHint,
            level,
            history: [],
            learnerTranscript: null,
            isOpening: true,
        });
        const { session, turn } = await this.prisma.$transaction(async (tx) => {
            const session = await tx.speakingSession.create({
                data: {
                    userId,
                    scenarioId: scenario.id,
                    level,
                    dialect,
                },
            });
            const turn = await tx.speakingTurn.create({
                data: {
                    sessionId: session.id,
                    turnIndex: 0,
                    promptText: opening.aiReply,
                    aiReply: opening.aiReply,
                    suggestion: opening.suggestion,
                    feedback: opening.feedback,
                    correction: opening.correction,
                },
            });
            return { session, turn };
        });
        const quota = await this.getQuota(userId);
        return {
            session: this.mapSession(session, scenario),
            turn: this.mapTurn(turn),
            quota,
        };
    }
    async getSession(userId, sessionId) {
        const session = await this.prisma.speakingSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                scenario: true,
                turns: { orderBy: { turnIndex: 'asc' } },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Không tìm thấy phiên luyện nói');
        }
        return {
            session: this.mapSession(session, session.scenario),
            turns: session.turns.map((turn) => this.mapTurn(turn)),
            quota: await this.getQuota(userId),
        };
    }
    async submitTurn(userId, sessionId, file, durationMs) {
        this.ensureOpenAi();
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Vui lòng gửi bản ghi âm');
        }
        if (file.size > exports.MAX_SPEAKING_AUDIO_BYTES) {
            throw new common_1.BadRequestException('File ghi âm vượt quá giới hạn cho phép');
        }
        if (!/^audio\/(webm|wav|mpeg|mp4|ogg|x-m4a|mp3)/i.test(file.mimetype) &&
            file.mimetype !== 'application/octet-stream') {
            throw new common_1.BadRequestException('Định dạng audio không được hỗ trợ');
        }
        if (typeof durationMs === 'number' &&
            durationMs > exports.MAX_SPEAKING_DURATION_MS + 1500) {
            throw new common_1.BadRequestException('Mỗi lượt nói tối đa 60 giây');
        }
        const session = await this.prisma.speakingSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                scenario: true,
                turns: { orderBy: { turnIndex: 'asc' } },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Không tìm thấy phiên luyện nói');
        }
        if (session.status !== client_1.SpeakingSessionStatus.ACTIVE) {
            throw new common_1.BadRequestException('Phiên luyện nói đã kết thúc');
        }
        await this.assertAndReserveQuota(userId);
        const latestPrompt = session.turns.at(-1)?.promptText ||
            session.turns.at(-1)?.aiReply ||
            session.scenario.openingHint;
        let transcription;
        try {
            transcription = await this.transcribeAudio(file);
        }
        catch (error) {
            await this.releaseQuotaReservation(userId);
            throw error;
        }
        if (!transcription.transcript) {
            await this.releaseQuotaReservation(userId);
            throw new common_1.BadRequestException('Không nhận diện được lời nói. Hãy thử ghi âm lại rõ hơn.');
        }
        const history = session.turns
            .filter((turn) => turn.aiReply || turn.transcript)
            .flatMap((turn) => {
            const items = [];
            if (turn.transcript) {
                items.push({ role: 'user', content: turn.transcript });
            }
            if (turn.aiReply) {
                items.push({ role: 'assistant', content: turn.aiReply });
            }
            return items;
        });
        let ai;
        try {
            ai = await this.generateAiReply({
                scenarioTitle: session.scenario.title,
                learnerRole: session.scenario.learnerRole,
                aiRole: session.scenario.aiRole,
                objective: session.scenario.objective,
                openingHint: session.scenario.openingHint,
                level: session.level,
                history,
                learnerTranscript: transcription.transcript,
                isOpening: false,
            });
        }
        catch (error) {
            await this.releaseQuotaReservation(userId);
            throw error;
        }
        const turnIndex = session.turnCount + 1;
        const [turn] = await this.prisma.$transaction([
            this.prisma.speakingTurn.create({
                data: {
                    sessionId: session.id,
                    turnIndex,
                    promptText: latestPrompt,
                    transcript: transcription.transcript,
                    suggestion: ai.suggestion,
                    feedback: ai.feedback,
                    correction: ai.correction,
                    aiReply: ai.aiReply,
                    durationMs: durationMs ?? null,
                    processingRaw: {
                        transcription: transcription.raw,
                    },
                },
            }),
            this.prisma.speakingSession.update({
                where: { id: session.id },
                data: { turnCount: turnIndex },
            }),
        ]);
        this.queueTurnScoring({
            turnId: turn.id,
            scenarioTitle: session.scenario.title,
            objective: session.scenario.objective,
            latestPrompt,
            transcript: transcription.transcript,
            durationMs,
            level: session.level,
            audio: file.buffer,
            processingRaw: {
                transcription: transcription.raw,
            },
        });
        return {
            turn: this.mapTurn(turn),
            quota: await this.getQuota(userId),
        };
    }
    async completeSession(userId, sessionId) {
        let session = await this.prisma.speakingSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                scenario: true,
                turns: { orderBy: { turnIndex: 'asc' } },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Không tìm thấy phiên luyện nói');
        }
        const pendingScores = session.turns
            .map((turn) => this.pendingTurnScores.get(turn.id))
            .filter((pending) => pending !== undefined);
        if (pendingScores.length) {
            await Promise.allSettled(pendingScores);
            const refreshedSession = await this.prisma.speakingSession.findFirst({
                where: { id: sessionId, userId },
                include: {
                    scenario: true,
                    turns: { orderBy: { turnIndex: 'asc' } },
                },
            });
            if (!refreshedSession) {
                throw new common_1.NotFoundException('Không tìm thấy phiên luyện nói');
            }
            session = refreshedSession;
        }
        const unscoredTurns = session.turns.filter((turn) => turn.transcript && turn.overall == null);
        for (const turn of unscoredTurns) {
            await this.scoreAndPersistTurn({
                turnId: turn.id,
                scenarioTitle: session.scenario.title,
                objective: session.scenario.objective,
                latestPrompt: turn.promptText,
                transcript: turn.transcript,
                durationMs: turn.durationMs ?? undefined,
                level: session.level,
                processingRaw: turn.processingRaw,
            });
        }
        if (unscoredTurns.length) {
            const refreshedSession = await this.prisma.speakingSession.findFirst({
                where: { id: sessionId, userId },
                include: {
                    scenario: true,
                    turns: { orderBy: { turnIndex: 'asc' } },
                },
            });
            if (!refreshedSession) {
                throw new common_1.NotFoundException('Không tìm thấy phiên luyện nói');
            }
            session = refreshedSession;
        }
        const updated = session.status === client_1.SpeakingSessionStatus.COMPLETED
            ? session
            : await this.prisma.speakingSession.update({
                where: { id: session.id },
                data: {
                    status: client_1.SpeakingSessionStatus.COMPLETED,
                    completedAt: new Date(),
                },
                include: {
                    scenario: true,
                    turns: { orderBy: { turnIndex: 'asc' } },
                },
            });
        const scoredTurns = updated.turns.filter((turn) => turn.overall != null || turn.transcript);
        const avg = (picker) => {
            const values = scoredTurns
                .map(picker)
                .filter((value) => typeof value === 'number');
            if (!values.length)
                return null;
            return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
        };
        return {
            session: this.mapSession(updated, updated.scenario),
            turns: updated.turns.map((turn) => this.mapTurn(turn)),
            summary: {
                turnsSpoken: scoredTurns.length,
                averageOverall: avg((turn) => turn.overall),
                averagePronunciation: avg((turn) => turn.pronunciation),
                averageFluency: avg((turn) => turn.fluency),
                averageGrammar: avg((turn) => turn.grammar),
                averageVocabulary: avg((turn) => turn.vocabulary),
                averageCoherence: avg((turn) => turn.coherence),
            },
            quota: await this.getQuota(userId),
        };
    }
    async ensureCatalog() {
        if (!this.catalogPromise) {
            this.catalogPromise = Promise.all(speaking_scenarios_1.SPEAKING_SCENARIOS.map((scenario) => this.prisma.speakingScenario.upsert({
                where: { slug: scenario.slug },
                create: { ...scenario },
                update: {
                    title: scenario.title,
                    description: scenario.description,
                    icon: scenario.icon,
                    color: scenario.color,
                    learnerRole: scenario.learnerRole,
                    aiRole: scenario.aiRole,
                    objective: scenario.objective,
                    minLevel: scenario.minLevel,
                    maxLevel: scenario.maxLevel,
                    openingHint: scenario.openingHint,
                    sortOrder: scenario.sortOrder,
                    isVisible: true,
                },
            }))).then(() => undefined);
        }
        try {
            await this.catalogPromise;
        }
        catch (error) {
            this.catalogPromise = null;
            throw error;
        }
    }
    resolvePremium(user) {
        if (!user.isPremium)
            return false;
        if (user.premiumExpiresAt && user.premiumExpiresAt <= new Date()) {
            return false;
        }
        return true;
    }
    usageDate() {
        const now = new Date();
        return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    }
    nextResetAt() {
        const date = this.usageDate();
        date.setUTCDate(date.getUTCDate() + 1);
        return date;
    }
    async getTodayUsage(userId) {
        const usage = await this.prisma.speakingDailyUsage.findUnique({
            where: {
                userId_usageDate: {
                    userId,
                    usageDate: this.usageDate(),
                },
            },
            select: { turnCount: true },
        });
        return usage?.turnCount ?? 0;
    }
    async assertAndReserveQuota(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { isPremium: true, premiumExpiresAt: true },
        });
        if (this.resolvePremium(user))
            return;
        const usageDate = this.usageDate();
        const reserved = await this.prisma.$transaction(async (tx) => {
            await tx.speakingDailyUsage.upsert({
                where: { userId_usageDate: { userId, usageDate } },
                create: { userId, usageDate, turnCount: 0 },
                update: {},
            });
            const updated = await tx.$queryRaw `
        UPDATE speaking_daily_usage
        SET turn_count = turn_count + 1, updated_at = NOW()
        WHERE user_id = ${userId}
          AND usage_date = ${usageDate}
          AND turn_count < ${exports.FREE_SPEAKING_TURNS_PER_DAY}
        RETURNING turn_count
      `;
            return updated[0] ?? null;
        });
        if (!reserved) {
            throw new common_1.ForbiddenException({
                statusCode: 403,
                message: 'Bạn đã hết 3 lượt luyện nói miễn phí hôm nay. Nâng cấp Premium để tiếp tục.',
                code: 'SPEAKING_QUOTA_EXCEEDED',
            });
        }
    }
    async releaseQuotaReservation(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { isPremium: true, premiumExpiresAt: true },
        });
        if (!user || this.resolvePremium(user))
            return;
        const usageDate = this.usageDate();
        await this.prisma.$executeRaw `
      UPDATE speaking_daily_usage
      SET turn_count = GREATEST(turn_count - 1, 0), updated_at = NOW()
      WHERE user_id = ${userId} AND usage_date = ${usageDate}
    `;
    }
    queueTurnScoring(input) {
        if (this.pendingTurnScores.has(input.turnId))
            return;
        const pending = this.scoreAndPersistTurn(input)
            .catch((error) => {
            const message = error instanceof Error ? error.message : JSON.stringify(error);
            this.logger.error(`Background speaking score failed for turn ${input.turnId}: ${message}`);
        })
            .finally(() => {
            this.pendingTurnScores.delete(input.turnId);
        });
        this.pendingTurnScores.set(input.turnId, pending);
    }
    async scoreAndPersistTurn(input) {
        const pronunciationPromise = input.audio && this.iflytekPronunciation?.isConfigured()
            ? this.iflytekPronunciation
                .assess({
                audio: input.audio,
                referenceText: input.transcript,
            })
                .catch((error) => {
                const message = error instanceof Error ? error.message : JSON.stringify(error);
                this.logger.warn(`iFLYTEK pronunciation assessment failed for turn ${input.turnId}: ${message}`);
                return null;
            })
            : Promise.resolve(null);
        const [assessment, pronunciationAssessment] = await Promise.all([
            this.assessSpeakingTurn({
                scenarioTitle: input.scenarioTitle,
                objective: input.objective,
                latestPrompt: input.latestPrompt,
                transcript: input.transcript,
                level: input.level,
            }),
            pronunciationPromise,
        ]);
        const scores = this.buildTurnScores(assessment, input.transcript, input.durationMs, input.level, pronunciationAssessment);
        const raw = input.processingRaw;
        const scoringData = pronunciationAssessment
            ? { assessment, pronunciationAssessment: pronunciationAssessment.raw }
            : { assessment };
        const processingRaw = raw && typeof raw === 'object' && !Array.isArray(raw)
            ? { ...raw, ...scoringData }
            : scoringData;
        await this.prisma.speakingTurn.update({
            where: { id: input.turnId },
            data: {
                ...scores,
                processingRaw: processingRaw,
            },
        });
    }
    async assessSpeakingTurn(input) {
        this.ensureOpenAi();
        let response;
        try {
            response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.1,
                max_tokens: 180,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: [
                            'You assess an English learner speaking turn from its transcript.',
                            'Return ONLY valid JSON with keys: grammar, vocabulary, coherence, relevance, cefrOverall.',
                            'All four scores must be integers from 0 to 100.',
                            'cefrOverall must be one of A1, A2, B1, B2, C1, or C2.',
                            'Grade fairly against the requested learner CEFR level.',
                            'Relevance measures how directly the learner answered the latest prompt.',
                            'Do not grade pronunciation because only a transcript is provided.',
                            'No markdown. No extra keys.',
                        ].join('\n'),
                    },
                    {
                        role: 'user',
                        content: [
                            `Scenario: ${input.scenarioTitle}`,
                            `Objective: ${input.objective}`,
                            `Requested learner level: ${input.level}`,
                            `Latest prompt: ${input.latestPrompt}`,
                            `Learner transcript: ${input.transcript}`,
                        ].join('\n'),
                    },
                ],
            });
        }
        catch (error) {
            this.logger.error('OpenAI speaking assessment failed', error);
            throw new common_1.ServiceUnavailableException('Không thể chấm điểm lúc này. Vui lòng thử lại sau.');
        }
        const text = response.choices[0]?.message?.content?.trim();
        if (!text) {
            throw new common_1.ServiceUnavailableException('AI không trả về điểm lượt nói');
        }
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch {
            throw new common_1.ServiceUnavailableException('AI trả về điểm lượt nói không hợp lệ');
        }
        return this.parseSpeakingAssessment(parsed);
    }
    buildTurnScores(assessment, transcript, durationMs, level, pronunciationAssessment) {
        const localFluency = this.calculateFluencyScore(transcript, durationMs, level);
        const fluency = pronunciationAssessment?.fluency ?? localFluency;
        const pronunciation = pronunciationAssessment?.pronunciation ?? null;
        const prosody = pronunciationAssessment?.standard ??
            pronunciationAssessment?.tone ??
            pronunciationAssessment?.emotion ??
            null;
        const weightedScores = [
            { value: assessment.grammar, weight: 0.25 },
            { value: assessment.vocabulary, weight: 0.2 },
            { value: assessment.coherence, weight: 0.2 },
            { value: assessment.relevance, weight: 0.25 },
            ...(fluency == null ? [] : [{ value: fluency, weight: 0.1 }]),
            ...(pronunciation == null
                ? []
                : [{ value: pronunciation, weight: 0.15 }]),
            ...(prosody == null ? [] : [{ value: prosody, weight: 0.1 }]),
        ];
        const totalWeight = weightedScores.reduce((total, score) => total + score.weight, 0);
        const overall = Math.round(weightedScores.reduce((total, score) => total + score.value * score.weight, 0) / totalWeight);
        return {
            pronunciation,
            fluency,
            grammar: assessment.grammar,
            vocabulary: assessment.vocabulary,
            coherence: assessment.coherence,
            overall,
            relevance: `${assessment.relevance}/100`,
            cefrOverall: assessment.cefrOverall,
        };
    }
    calculateFluencyScore(transcript, durationMs, level) {
        if (!durationMs || durationMs < 500)
            return null;
        const wordCount = transcript.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)?.length ?? 0;
        if (!wordCount)
            return null;
        const wordsPerMinute = wordCount / (durationMs / 60_000);
        const targetRanges = {
            A1: [55, 90],
            A2: [65, 105],
            B1: [75, 120],
            B2: [85, 135],
            C1: [95, 150],
            C2: [100, 160],
        };
        const [minimum, maximum] = targetRanges[level];
        const distance = wordsPerMinute < minimum
            ? minimum - wordsPerMinute
            : wordsPerMinute > maximum
                ? wordsPerMinute - maximum
                : 0;
        return Math.round(Math.max(45, Math.min(100, 100 - distance * 0.8)));
    }
    async transcribeAudio(file) {
        this.ensureOpenAi();
        const audioFile = await (0, openai_1.toFile)(file.buffer, file.originalname || 'speaking.webm', { type: file.mimetype || 'audio/webm' });
        const transcription = await this.openai.audio.transcriptions.create({
            file: audioFile,
            model: this.config.get('SPEAKING_TRANSCRIPTION_MODEL')?.trim() ||
                'gpt-4o-mini-transcribe',
            language: 'en',
        });
        return {
            transcript: transcription.text.trim(),
            raw: {
                provider: 'openai',
                model: this.config.get('SPEAKING_TRANSCRIPTION_MODEL')?.trim() ||
                    'gpt-4o-mini-transcribe',
            },
        };
    }
    ensureOpenAi() {
        if (!this.openai) {
            throw new common_1.ServiceUnavailableException('OPENAI_API_KEY chưa được cấu hình trên server');
        }
    }
    async translateToVietnamese(text) {
        this.ensureOpenAi();
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.1,
                max_tokens: 500,
                messages: [
                    {
                        role: 'system',
                        content: 'Translate the English text into natural Vietnamese. Return only the translation, no explanation or quotation marks.',
                    },
                    { role: 'user', content: text.trim() },
                ],
            });
            const translation = response.choices[0]?.message?.content?.trim();
            if (!translation) {
                throw new common_1.ServiceUnavailableException('AI không trả về bản dịch');
            }
            return { translation };
        }
        catch (error) {
            if (error instanceof common_1.ServiceUnavailableException)
                throw error;
            this.logger.error('OpenAI speaking translation failed', error);
            throw new common_1.ServiceUnavailableException('Không thể dịch lúc này. Vui lòng thử lại sau.');
        }
    }
    async generateAiReply(input) {
        this.ensureOpenAi();
        const system = [
            'You are an English speaking practice partner for Vietnamese learners.',
            `Stay in character as: ${input.aiRole}.`,
            `The learner is role-playing as: ${input.learnerRole}.`,
            `Scenario: ${input.scenarioTitle}.`,
            `Objective: ${input.objective}.`,
            `Learner CEFR level: ${input.level}. ${LEVEL_GUIDANCE[input.level]}`,
            'Return ONLY valid JSON with keys: aiReply, feedback, suggestion, correction.',
            'aiReply: your next spoken line in English (1-3 short sentences), stay in role, ask one clear follow-up when natural.',
            'feedback: short Vietnamese feedback about the learner utterance. Mention the grammar issue briefly when you provide a correction.',
            'suggestion: one short, natural English reply the learner can say NEXT to answer aiReply.',
            'The suggestion must directly fit the latest aiReply, match the learner CEFR level, and be easy to read aloud.',
            'suggestion is a NEW role-play reply, not a rewrite of what the learner just said.',
            'Never copy, extend, or start with the correction. Never reuse distinctive words from the learner transcript or correction unless they are required to answer aiReply.',
            'Bad example: learner said "I was lies", correction "I lied", aiReply asks them to order food → suggestion must NOT be "I lied about my order."',
            'Good example: same case → suggestion "I would like a pizza, please."',
            'If the suggestion needs the learner name, use "Nam" directly. Never use placeholders such as [Your Name] or "your name".',
            'Do not repeat the learner transcript as the suggestion.',
            'correction: rewrite the learner transcript into ONE grammatical English sentence that keeps their intended meaning. Fix grammar, missing words, and redundant phrases. Example: "I went to go to work" → "I went to work". If the transcript is already correct and natural, return an empty string. Do not add new ideas. Do not copy aiReply or suggestion.',
            'No markdown. No extra keys.',
        ].join('\n');
        const userContent = input.isOpening
            ? `Start the role-play. Opening hint: ${input.openingHint}`
            : [
                `Learner said: ${input.learnerTranscript}`,
                'Respond in character, correct the learner sentence if needed, and give concise coaching feedback.',
            ]
                .filter(Boolean)
                .join('\n');
        let response;
        try {
            response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.7,
                max_tokens: 320,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: system },
                    ...input.history.slice(-12),
                    { role: 'user', content: userContent },
                ],
            });
        }
        catch (error) {
            this.logger.error('OpenAI speaking reply failed', error);
            const status = typeof error === 'object' &&
                error &&
                'status' in error &&
                typeof error.status === 'number'
                ? error.status
                : undefined;
            if (status === 401 || status === 403) {
                throw new common_1.ServiceUnavailableException('OPENAI_API_KEY không hợp lệ hoặc đã hết hạn. Hãy cập nhật key trong .env rồi khởi động lại server.');
            }
            throw new common_1.ServiceUnavailableException('Không thể kết nối AI lúc này. Vui lòng thử lại sau.');
        }
        const text = response.choices[0]?.message?.content?.trim();
        if (!text) {
            throw new common_1.ServiceUnavailableException('AI không trả về nội dung');
        }
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch {
            throw new common_1.ServiceUnavailableException('AI trả về dữ liệu không hợp lệ');
        }
        const aiReply = parsed.aiReply?.trim();
        if (!aiReply) {
            throw new common_1.ServiceUnavailableException('AI không tạo được câu trả lời');
        }
        const rawSuggestion = parsed.suggestion?.trim();
        if (!rawSuggestion) {
            throw new common_1.ServiceUnavailableException('AI không tạo được câu gợi ý');
        }
        const suggestion = rawSuggestion.replace(/\[\s*your\s+name\s*\]|\(\s*your\s+name\s*\)|<\s*your\s+name\s*>|\byour\s+name\b/gi, 'Nam');
        const correction = resolveGrammarCorrection(input.learnerTranscript, parsed.correction);
        return {
            aiReply,
            feedback: parsed.feedback?.trim() || null,
            suggestion: await this.ensureNextTurnSuggestion({
                suggestion,
                correction,
                aiReply,
                scenarioTitle: input.scenarioTitle,
                level: input.level,
            }),
            correction,
        };
    }
    async ensureNextTurnSuggestion(input) {
        if (!suggestionCopiesCorrection(input.suggestion, input.correction)) {
            return input.suggestion;
        }
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.4,
                max_tokens: 80,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: [
                            'Write one short English sentence a learner can say next in a speaking role-play.',
                            `Scenario: ${input.scenarioTitle}.`,
                            `Learner CEFR level: ${input.level}. ${LEVEL_GUIDANCE[input.level]}`,
                            'Return ONLY JSON with key suggestion.',
                            'The sentence must answer the partner line below.',
                            'Do not rewrite, continue, or mention the learner\'s previous sentence.',
                        ].join(' '),
                    },
                    {
                        role: 'user',
                        content: `Partner said: ${input.aiReply}`,
                    },
                ],
            });
            const text = response.choices[0]?.message?.content?.trim();
            if (!text)
                return input.suggestion;
            const parsed = JSON.parse(text);
            const nextSuggestion = parsed.suggestion?.trim();
            if (!nextSuggestion ||
                suggestionCopiesCorrection(nextSuggestion, input.correction)) {
                return input.suggestion;
            }
            return nextSuggestion.replace(/\[\s*your\s+name\s*\]|\(\s*your\s+name\s*\)|<\s*your\s+name\s*>|\byour\s+name\b/gi, 'Nam');
        }
        catch {
            return input.suggestion;
        }
    }
    parseSpeakingAssessment(assessment) {
        const score = (value) => {
            if (typeof value !== 'number' || !Number.isFinite(value)) {
                throw new common_1.ServiceUnavailableException('AI trả về điểm lượt nói không hợp lệ');
            }
            return Math.round(Math.max(0, Math.min(100, value)));
        };
        const cefrOverall = assessment?.cefrOverall;
        if (typeof cefrOverall !== 'string' ||
            !Object.values(client_1.CefrLevel).includes(cefrOverall)) {
            throw new common_1.ServiceUnavailableException('AI trả về trình độ lượt nói không hợp lệ');
        }
        return {
            grammar: score(assessment?.grammar),
            vocabulary: score(assessment?.vocabulary),
            coherence: score(assessment?.coherence),
            relevance: score(assessment?.relevance),
            cefrOverall: cefrOverall,
        };
    }
    mapSession(session, scenario) {
        return {
            id: session.id,
            level: session.level,
            dialect: session.dialect,
            status: session.status,
            turnCount: session.turnCount,
            createdAt: session.createdAt,
            completedAt: session.completedAt,
            scenario: {
                id: scenario.id,
                slug: scenario.slug,
                title: scenario.title,
                description: scenario.description,
                icon: scenario.icon,
                color: scenario.color,
                learnerRole: scenario.learnerRole,
                aiRole: scenario.aiRole,
                objective: scenario.objective,
            },
        };
    }
    mapTurn(turn) {
        return {
            id: turn.id,
            turnIndex: turn.turnIndex,
            promptText: turn.promptText,
            transcript: turn.transcript,
            suggestion: turn.suggestion,
            feedback: turn.feedback,
            correction: turn.correction,
            aiReply: turn.aiReply,
            scores: {
                pronunciation: turn.pronunciation,
                fluency: turn.fluency,
                grammar: turn.grammar,
                vocabulary: turn.vocabulary,
                coherence: turn.coherence,
                overall: turn.overall,
                relevance: turn.relevance,
                cefrOverall: turn.cefrOverall,
            },
            durationMs: turn.durationMs,
            createdAt: turn.createdAt,
        };
    }
};
exports.SpeakingService = SpeakingService;
exports.SpeakingService = SpeakingService = SpeakingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        iflytek_pronunciation_service_1.IflytekPronunciationService])
], SpeakingService);
//# sourceMappingURL=speaking.service.js.map