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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var VocabularyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VocabularyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const openai_1 = __importDefault(require("openai"));
const prisma_service_1 = require("../prisma/prisma.service");
const vocabulary_srs_1 = require("./vocabulary-srs");
const vocabulary_tech_sets_1 = require("./vocabulary-tech-sets");
const vocabulary_travel_set_1 = require("./vocabulary-travel-set");
const vocabulary_daily_set_1 = require("./vocabulary-daily-set");
const vocabulary_movie_set_1 = require("./vocabulary-movie-set");
const vocabulary_office_set_1 = require("./vocabulary-office-set");
const vocabulary_education_set_1 = require("./vocabulary-education-set");
const vocabulary_economy_set_1 = require("./vocabulary-economy-set");
const vocabulary_business_set_1 = require("./vocabulary-business-set");
const vocabulary_banking_set_1 = require("./vocabulary-banking-set");
const vocabulary_finance_set_1 = require("./vocabulary-finance-set");
const vocabulary_common_set_1 = require("./vocabulary-common-set");
const SETS = [
    vocabulary_common_set_1.COMMON_VOCABULARY_SET,
    vocabulary_travel_set_1.TRAVEL_VOCABULARY_SET,
    vocabulary_daily_set_1.DAILY_VOCABULARY_SET,
    vocabulary_office_set_1.OFFICE_VOCABULARY_SET,
    vocabulary_movie_set_1.MOVIE_VOCABULARY_SET,
    ...vocabulary_tech_sets_1.TECH_VOCABULARY_SETS,
    vocabulary_education_set_1.EDUCATION_VOCABULARY_SET,
    vocabulary_economy_set_1.ECONOMY_VOCABULARY_SET,
    vocabulary_business_set_1.BUSINESS_VOCABULARY_SET,
    vocabulary_banking_set_1.BANKING_VOCABULARY_SET,
    vocabulary_finance_set_1.FINANCE_VOCABULARY_SET,
];
const vocabulary_key_1 = require("./vocabulary-key");
let VocabularyService = VocabularyService_1 = class VocabularyService {
    prisma;
    config;
    logger = new common_1.Logger(VocabularyService_1.name);
    catalogSync = null;
    lookupRequests = new Map();
    lookupDetailCache = new Map();
    openai = null;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        const apiKey = this.config.get('OPENAI_API_KEY');
        if (apiKey)
            this.openai = new openai_1.default({ apiKey });
    }
    publicProgress(progress) {
        return {
            id: progress.id,
            status: progress.status,
            reviewCount: progress.reviewCount,
            correctCount: progress.correctCount,
            streak: progress.streak,
            lapses: progress.lapses,
            intervalDays: progress.intervalDays,
            easeFactor: progress.easeFactor,
            lastReviewedAt: progress.lastReviewedAt,
            nextReviewAt: progress.nextReviewAt,
        };
    }
    mapDueWord(progress) {
        const { set, ...word } = progress.word;
        return {
            ...word,
            setTitle: set.title,
            progress: this.publicProgress(progress),
        };
    }
    normalizeLookupWord(value) {
        return value
            .trim()
            .toLowerCase()
            .replace(/^[^a-z'-]+|[^a-z'-]+$/g, '')
            .slice(0, 64);
    }
    lookupCandidates(word) {
        const candidates = new Set([word]);
        if (word.endsWith("'s"))
            candidates.add(word.slice(0, -2));
        if (word.endsWith('ies') && word.length > 4) {
            candidates.add(`${word.slice(0, -3)}y`);
        }
        if (word.endsWith('ing') && word.length > 5) {
            const stem = word.slice(0, -3);
            candidates.add(stem);
            candidates.add(`${stem}e`);
            if (stem.at(-1) === stem.at(-2))
                candidates.add(stem.slice(0, -1));
        }
        if (word.endsWith('ed') && word.length > 4) {
            const stem = word.slice(0, -2);
            candidates.add(stem);
            candidates.add(`${stem}e`);
        }
        if (word.endsWith('s') && word.length > 3)
            candidates.add(word.slice(0, -1));
        return [...candidates].filter(Boolean);
    }
    ensureCatalog() {
        if (!this.catalogSync) {
            this.catalogSync = this.syncCatalog().catch((error) => {
                this.catalogSync = null;
                throw error;
            });
        }
        return this.catalogSync;
    }
    async syncCatalog() {
        const keepSlugs = SETS.map((set) => set.slug);
        await this.prisma.vocabularySet.deleteMany({
            where: {
                slug: {
                    startsWith: 'cong-nghe-',
                    notIn: keepSlugs,
                },
            },
        });
        const existing = await this.prisma.vocabularySet.findMany({
            where: { slug: { in: keepSlugs } },
            select: {
                id: true,
                slug: true,
                _count: { select: { words: true } },
            },
        });
        const bySlug = new Map(existing.map((set) => [set.slug, set]));
        const alreadySynced = SETS.every((set) => {
            const found = bySlug.get(set.slug);
            return !!found && found._count.words === set.words.length;
        });
        if (alreadySynced)
            return;
        for (const set of SETS) {
            const current = bySlug.get(set.slug);
            if (current && current._count.words === set.words.length) {
                await this.prisma.vocabularySet.update({
                    where: { id: current.id },
                    data: {
                        title: set.title,
                        description: set.description,
                        icon: set.icon,
                        color: set.color,
                        cefrLevel: set.cefrLevel,
                        topic: set.topic,
                        isFeatured: set.isFeatured,
                        sortOrder: set.sortOrder,
                    },
                });
                continue;
            }
            const vocabularySet = await this.prisma.vocabularySet.upsert({
                where: { slug: set.slug },
                create: {
                    slug: set.slug,
                    title: set.title,
                    description: set.description,
                    icon: set.icon,
                    color: set.color,
                    cefrLevel: set.cefrLevel,
                    topic: set.topic,
                    isFeatured: set.isFeatured,
                    sortOrder: set.sortOrder,
                },
                update: {
                    title: set.title,
                    description: set.description,
                    icon: set.icon,
                    color: set.color,
                    cefrLevel: set.cefrLevel,
                    topic: set.topic,
                    isFeatured: set.isFeatured,
                    sortOrder: set.sortOrder,
                },
            });
            await this.prisma.vocabularyWord.deleteMany({
                where: { setId: vocabularySet.id },
            });
            await this.prisma.vocabularyWord.createMany({
                data: set.words.map((word, index) => ({
                    setId: vocabularySet.id,
                    word: word[0],
                    phonetic: word[1],
                    meaning: word[2],
                    example: word[3],
                    exampleTranslation: word[4],
                    sortOrder: index + 1,
                })),
            });
        }
    }
    async getOverview(userId) {
        await this.ensureCatalog();
        if (!userId) {
            const sets = await this.prisma.vocabularySet.findMany({
                orderBy: { sortOrder: 'asc' },
                include: { _count: { select: { words: true } } },
            });
            return {
                stats: {
                    totalLearned: 0,
                    mastered: 0,
                    learning: 0,
                    dueCount: 0,
                    learnedToday: 0,
                },
                sets: sets.map((set) => ({
                    id: set.id,
                    slug: set.slug,
                    title: set.title,
                    description: set.description,
                    icon: set.icon,
                    color: set.color,
                    cefrLevel: set.cefrLevel,
                    topic: set.topic,
                    isFeatured: set.isFeatured,
                    wordCount: set._count.words,
                    learnedCount: 0,
                    saved: false,
                })),
                mySets: [],
                dueWords: [],
            };
        }
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const [totalLearned, mastered, dueCount, learnedToday, sets, mySets, dueWords, learnedProgress,] = await Promise.all([
            this.prisma.userVocabularyProgress.count({ where: { userId } }),
            this.prisma.userVocabularyProgress.count({
                where: { userId, status: client_1.VocabularyProgressStatus.MASTERED },
            }),
            this.prisma.userVocabularyProgress.count({
                where: { userId, nextReviewAt: { lte: now } },
            }),
            this.prisma.userVocabularyProgress.count({
                where: { userId, learnedAt: { gte: startOfDay } },
            }),
            this.prisma.vocabularySet.findMany({
                orderBy: { sortOrder: 'asc' },
                include: {
                    _count: { select: { words: true } },
                    savedBy: { where: { userId }, select: { id: true } },
                },
            }),
            this.prisma.userVocabularySet.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    set: {
                        include: { _count: { select: { words: true } } },
                    },
                },
            }),
            this.prisma.userVocabularyProgress.findMany({
                where: { userId, nextReviewAt: { lte: now } },
                orderBy: { nextReviewAt: 'asc' },
                take: vocabulary_srs_1.OVERVIEW_DUE_PREVIEW,
                include: { word: { include: { set: true } } },
            }),
            this.prisma.userVocabularyProgress.findMany({
                where: { userId },
                select: { word: { select: { setId: true } } },
            }),
        ]);
        const learnedCountBySet = new Map();
        for (const item of learnedProgress) {
            const setId = item.word.setId;
            learnedCountBySet.set(setId, (learnedCountBySet.get(setId) ?? 0) + 1);
        }
        return {
            stats: {
                totalLearned,
                mastered,
                learning: totalLearned - mastered,
                dueCount,
                learnedToday,
            },
            sets: sets.map((set) => ({
                id: set.id,
                slug: set.slug,
                title: set.title,
                description: set.description,
                icon: set.icon,
                color: set.color,
                cefrLevel: set.cefrLevel,
                topic: set.topic,
                isFeatured: set.isFeatured,
                wordCount: set._count.words,
                learnedCount: learnedCountBySet.get(set.id) ?? 0,
                saved: set.savedBy.length > 0,
            })),
            mySets: mySets.map(({ set }) => ({
                id: set.id,
                slug: set.slug,
                title: set.title,
                description: set.description,
                icon: set.icon,
                color: set.color,
                cefrLevel: set.cefrLevel,
                topic: set.topic,
                wordCount: set._count.words,
                learnedCount: learnedCountBySet.get(set.id) ?? 0,
                saved: true,
            })),
            dueWords: dueWords.map((progress) => this.mapDueWord(progress)),
        };
    }
    async withSavedWord(userId, detail) {
        const saved = userId ? await this.prisma.savedVocabularyWord.findUnique({
            where: { userId_wordKey_senseKey: { userId, wordKey: (0, vocabulary_key_1.vocabularyKey)(detail.word), senseKey: (0, vocabulary_key_1.vocabularySenseKey)(detail.meaning) } },
            include: { sources: { select: { sourceKey: true } } },
        }) : null;
        return { ...detail, savedWordId: saved?.id ?? null, savedSourceKeys: saved?.sources.map((source) => source.sourceKey) ?? [], progress: saved ? this.publicProgress(saved) : null };
    }
    async lookupWord(userId, input) {
        const requestedWord = this.normalizeLookupWord(input.word);
        if (!requestedWord) {
            throw new common_1.BadRequestException('Từ cần tra cứu không hợp lệ');
        }
        const cacheKey = `${requestedWord}\n${input.sentence.trim().toLowerCase()}`;
        const candidates = this.lookupCandidates(requestedWord);
        const existing = await this.prisma.vocabularyWord.findFirst({
            where: {
                OR: candidates.map((word) => ({
                    word: { equals: word, mode: 'insensitive' },
                })),
            },
            orderBy: { sortOrder: 'asc' },
            include: {
                progress: {
                    where: { userId: userId ?? '__guest__' },
                    take: 1,
                },
            },
        });
        if (existing) {
            let enriched = this.lookupDetailCache.get(cacheKey) ?? null;
            if (!enriched && this.openai) {
                try {
                    enriched = await this.getGeneratedWordDetail(cacheKey, requestedWord, input);
                }
                catch {
                }
            }
            return this.withSavedWord(userId, {
                id: existing.id,
                requestedWord,
                word: existing.word,
                phonetic: enriched?.phonetic ?? existing.phonetic,
                partOfSpeech: enriched?.partOfSpeech ?? null,
                meaning: enriched?.meaning ?? existing.meaning,
                definition: enriched?.definition ?? existing.meaning,
                example: enriched?.example ?? existing.example,
                exampleTranslation: enriched?.exampleTranslation ?? existing.exampleTranslation,
                audioUrl: existing.audioUrl,
                synonyms: enriched?.synonyms ?? [],
                relatedWords: enriched?.relatedWords ?? [],
                source: 'catalog',
            });
        }
        const generated = await this.getGeneratedWordDetail(cacheKey, requestedWord, input);
        return this.withSavedWord(userId, {
            id: `lookup-${(0, vocabulary_key_1.vocabularySenseKey)(cacheKey)}`,
            requestedWord,
            ...generated,
            audioUrl: null,
            source: 'generated',
        });
    }
    async getGeneratedWordDetail(cacheKey, requestedWord, input) {
        const cached = this.lookupDetailCache.get(cacheKey);
        if (cached)
            return cached;
        let detailRequest = this.lookupRequests.get(cacheKey);
        if (!detailRequest) {
            detailRequest = this.generateWordDetail(requestedWord, input).finally(() => this.lookupRequests.delete(cacheKey));
            this.lookupRequests.set(cacheKey, detailRequest);
        }
        const detail = await detailRequest;
        this.lookupDetailCache.set(cacheKey, detail);
        if (this.lookupDetailCache.size > 500) {
            const oldestKey = this.lookupDetailCache.keys().next().value;
            if (oldestKey)
                this.lookupDetailCache.delete(oldestKey);
        }
        return detail;
    }
    async generateWordDetail(requestedWord, input) {
        if (!this.openai) {
            throw new common_1.ServiceUnavailableException('Chưa thể tra cứu từ mới vì OPENAI_API_KEY chưa được cấu hình');
        }
        try {
            const response = await this.openai.chat.completions.create({
                model: this.config.get('VOCABULARY_LOOKUP_MODEL')?.trim() ||
                    'gpt-4o-mini',
                temperature: 0.1,
                max_tokens: 700,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: [
                            'You create concise English vocabulary details for Vietnamese learners.',
                            'Use the supplied sentence to choose the correct contextual meaning.',
                            'Return only JSON with keys: word, phonetic, partOfSpeech, meaning, definition, example, exampleTranslation, synonyms, relatedWords.',
                            'word must be the lowercase dictionary headword. phonetic must be IPA wrapped in slashes.',
                            'partOfSpeech, meaning, definition, exampleTranslation, and relatedWords.note must be Vietnamese.',
                            'synonyms must contain at most 4 English words. relatedWords must contain at most 3 objects with word and note.',
                            'example must be one natural English sentence containing the headword or its inflected form.',
                        ].join(' '),
                    },
                    {
                        role: 'user',
                        content: JSON.stringify({
                            selectedWord: requestedWord,
                            sentence: input.sentence.trim(),
                            sentenceTranslation: input.sentenceTranslation.trim(),
                        }),
                    },
                ],
            });
            const content = response.choices[0]?.message?.content?.trim();
            if (!content)
                throw new Error('AI returned an empty vocabulary detail');
            const parsed = JSON.parse(content);
            const text = (value, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
            const words = (value) => Array.isArray(value)
                ? value
                    .filter((item) => typeof item === 'string')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, 4)
                : [];
            const relatedWords = Array.isArray(parsed.relatedWords)
                ? parsed.relatedWords
                    .map((item) => {
                    if (!item || typeof item !== 'object')
                        return null;
                    const record = item;
                    const word = text(record.word);
                    if (!word)
                        return null;
                    return { word, note: text(record.note) };
                })
                    .filter((item) => item != null)
                    .slice(0, 3)
                : [];
            const normalizedHeadword = this.normalizeLookupWord(text(parsed.word, requestedWord)) ||
                requestedWord;
            const meaning = text(parsed.meaning);
            if (!meaning)
                throw new Error('AI returned vocabulary detail without meaning');
            return {
                word: normalizedHeadword,
                phonetic: text(parsed.phonetic) || null,
                partOfSpeech: text(parsed.partOfSpeech) || null,
                meaning,
                definition: text(parsed.definition, meaning),
                example: text(parsed.example, input.sentence.trim()),
                exampleTranslation: text(parsed.exampleTranslation, input.sentenceTranslation.trim()),
                synonyms: words(parsed.synonyms),
                relatedWords,
            };
        }
        catch (error) {
            this.logger.error(`Vocabulary lookup failed for "${requestedWord}": ${error instanceof Error ? error.message : String(error)}`);
            throw new common_1.ServiceUnavailableException('Không thể tra cứu chi tiết từ vựng lúc này. Vui lòng thử lại.');
        }
    }
    async getSets(userId) {
        const overview = await this.getOverview(userId);
        return overview.sets;
    }
    async getSet(userId, id) {
        await this.ensureCatalog();
        if (!userId) {
            const set = await this.prisma.vocabularySet.findUnique({
                where: { id },
                include: {
                    words: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            });
            if (!set) {
                throw new common_1.NotFoundException('KhÃ´ng tÃ¬m tháº¥y bá»™ tá»« vá»±ng');
            }
            return {
                ...set,
                saved: false,
                words: set.words.map((word) => ({
                    ...word,
                    progress: null,
                })),
            };
        }
        const set = await this.prisma.vocabularySet.findUnique({
            where: { id },
            include: {
                savedBy: { where: { userId }, select: { id: true } },
                words: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        progress: { where: { userId } },
                    },
                },
            },
        });
        if (!set)
            throw new common_1.NotFoundException('Không tìm thấy bộ từ vựng');
        return {
            ...set,
            saved: set.savedBy.length > 0,
            words: set.words.map((word) => ({
                ...word,
                progress: word.progress[0] ?? null,
            })),
        };
    }
    async saveSet(userId, setId) {
        await this.prisma.vocabularySet.findUniqueOrThrow({
            where: { id: setId },
        });
        await this.prisma.userVocabularySet.upsert({
            where: { userId_setId: { userId, setId } },
            create: { userId, setId },
            update: {},
        });
        return { saved: true };
    }
    async removeSet(userId, setId) {
        await this.prisma.userVocabularySet.deleteMany({
            where: { userId, setId },
        });
        return { saved: false };
    }
    async learnWord(userId, wordId, correct = true) {
        await this.prisma.vocabularyWord.findUniqueOrThrow({
            where: { id: wordId },
        });
        const now = new Date();
        const schedule = (0, vocabulary_srs_1.scheduleLearn)(now, correct);
        return this.prisma.userVocabularyProgress.upsert({
            where: { userId_wordId: { userId, wordId } },
            create: {
                userId,
                wordId,
                learnedAt: now,
                status: client_1.VocabularyProgressStatus.LEARNING,
                reviewCount: schedule.reviewCount,
                correctCount: schedule.correctCount,
                streak: schedule.streak,
                lapses: schedule.lapses,
                intervalDays: schedule.intervalDays,
                easeFactor: schedule.easeFactor,
                nextReviewAt: schedule.nextReviewAt,
            },
            update: {},
        });
    }
    async reviewWord(userId, wordId, correct) {
        let progress = await this.prisma.userVocabularyProgress.findUnique({
            where: { userId_wordId: { userId, wordId } },
        });
        if (!progress) {
            progress = await this.learnWord(userId, wordId, correct);
        }
        const schedule = (0, vocabulary_srs_1.scheduleReview)({
            reviewCount: progress.reviewCount,
            correctCount: progress.correctCount,
            streak: progress.streak,
            lapses: progress.lapses,
            intervalDays: progress.intervalDays,
            easeFactor: progress.easeFactor,
            status: progress.status,
        }, correct, new Date());
        return this.prisma.userVocabularyProgress.update({
            where: { id: progress.id },
            data: {
                reviewCount: schedule.reviewCount,
                correctCount: schedule.correctCount,
                streak: schedule.streak,
                lapses: schedule.lapses,
                intervalDays: schedule.intervalDays,
                easeFactor: schedule.easeFactor,
                status: schedule.status === 'MASTERED'
                    ? client_1.VocabularyProgressStatus.MASTERED
                    : client_1.VocabularyProgressStatus.LEARNING,
                lastReviewedAt: schedule.lastReviewedAt,
                nextReviewAt: schedule.nextReviewAt,
            },
        });
    }
    async getLearnSession(userId, query = {}) {
        await this.ensureCatalog();
        const take = (0, vocabulary_srs_1.clampSessionLimit)(query.limit, vocabulary_srs_1.LEARN_SESSION_LIMIT);
        const set = query.setId
            ? await this.prisma.vocabularySet.findUnique({
                where: { id: query.setId },
            })
            : await this.pickSetWithNewWords(userId);
        if (query.setId && !set) {
            throw new common_1.NotFoundException('Không tìm thấy bộ từ vựng');
        }
        if (!set) {
            return {
                type: 'learn',
                setId: null,
                setTitle: null,
                remainingNewCount: 0,
                dueCount: 0,
                words: [],
            };
        }
        const now = new Date();
        const [remainingNewCount, dueCount, words] = await Promise.all([
            this.prisma.vocabularyWord.count({
                where: { setId: set.id, progress: { none: { userId } } },
            }),
            this.prisma.userVocabularyProgress.count({
                where: {
                    userId,
                    nextReviewAt: { lte: now },
                    word: { setId: set.id },
                },
            }),
            this.prisma.vocabularyWord.findMany({
                where: { setId: set.id, progress: { none: { userId } } },
                orderBy: { sortOrder: 'asc' },
                take,
                include: { set: { select: { title: true } } },
            }),
        ]);
        return {
            type: 'learn',
            setId: set.id,
            setTitle: set.title,
            remainingNewCount,
            dueCount,
            words: words.map((word) => {
                const { set: wordSet, ...rest } = word;
                return {
                    ...rest,
                    setTitle: wordSet.title,
                    progress: null,
                };
            }),
        };
    }
    async getReviewSession(userId, query = {}) {
        await this.ensureCatalog();
        const take = (0, vocabulary_srs_1.clampSessionLimit)(query.limit, vocabulary_srs_1.REVIEW_SESSION_LIMIT);
        if (query.setId) {
            const set = await this.prisma.vocabularySet.findUnique({
                where: { id: query.setId },
                select: { id: true },
            });
            if (!set)
                throw new common_1.NotFoundException('Không tìm thấy bộ từ vựng');
        }
        const now = new Date();
        const where = {
            userId,
            nextReviewAt: { lte: now },
            ...(query.setId ? { word: { setId: query.setId } } : {}),
        };
        const [dueCount, dueWords] = await Promise.all([
            this.prisma.userVocabularyProgress.count({ where }),
            this.prisma.userVocabularyProgress.findMany({
                where,
                orderBy: { nextReviewAt: 'asc' },
                take,
                include: { word: { include: { set: true } } },
            }),
        ]);
        return {
            type: 'review',
            setId: query.setId ?? null,
            setTitle: dueWords[0]?.word.set.title ?? null,
            remainingNewCount: 0,
            dueCount,
            words: dueWords.map((progress) => this.mapDueWord(progress)),
        };
    }
    async pickSetWithNewWords(userId) {
        const sets = await this.prisma.vocabularySet.findMany({
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                title: true,
                words: {
                    where: { progress: { none: { userId } } },
                    take: 1,
                    select: { id: true },
                },
                savedBy: {
                    where: { userId },
                    select: { createdAt: true },
                },
            },
        });
        const withNewWords = sets.filter((set) => set.words.length > 0);
        const savedFirst = withNewWords
            .filter((set) => set.savedBy.length > 0)
            .sort((a, b) => b.savedBy[0].createdAt.getTime() - a.savedBy[0].createdAt.getTime());
        return savedFirst[0] ?? withNewWords[0] ?? sets[0] ?? null;
    }
};
exports.VocabularyService = VocabularyService;
exports.VocabularyService = VocabularyService = VocabularyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], VocabularyService);
//# sourceMappingURL=vocabulary.service.js.map