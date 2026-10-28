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
var PublicCatalogCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicCatalogCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const zlib_1 = require("zlib");
const redis_1 = require("redis");
const PUBLISH = `if redis.call('GET', KEYS[2]) == ARGV[1] then redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3]); redis.call('DEL', KEYS[2]); return 1 end; return 0`;
const RELEASE = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end; return 0`;
const INVALIDATE = `return redis.call('DEL', KEYS[1], KEYS[2])`;
let PublicCatalogCacheService = PublicCatalogCacheService_1 = class PublicCatalogCacheService {
    config;
    logger = new common_1.Logger(PublicCatalogCacheService_1.name);
    client;
    pending = new Map();
    generations = new Map();
    warmers = new Map();
    timers = new Map();
    bootstrapReady = false;
    stopped = false;
    lastWarning = 0;
    prefix;
    commandMs;
    metrics = { hits: 0, misses: 0, loads: 0, errors: 0 };
    constructor(config) {
        this.config = config;
        this.prefix =
            config.get('REDIS_CACHE_PREFIX') ||
                `hihienglish:${process.env.NODE_ENV || 'development'}:public:v1`;
        this.commandMs = Math.max(20, Math.min(1000, Number(config.get('REDIS_COMMAND_TIMEOUT_MS')) || 150));
    }
    onModuleInit() {
        const url = this.config.get('REDIS_URL');
        if (!url)
            return;
        try {
            this.client = (0, redis_1.createClient)({
                url,
                disableOfflineQueue: true,
                commandsQueueMaxLength: 200,
                socket: {
                    connectTimeout: 500,
                    reconnectStrategy: (attempt) => Math.min(500 * (attempt + 1), 5000),
                },
            });
            this.client.on('error', () => this.warn());
            this.client.on('ready', () => {
                if (this.bootstrapReady)
                    void this.warmAll();
            });
            void this.client.connect().catch(() => this.warn());
        }
        catch {
            this.warn();
        }
    }
    onApplicationBootstrap() {
        this.bootstrapReady = true;
        if (this.client?.isReady)
            void this.warmAll();
    }
    onModuleDestroy() {
        this.stopped = true;
        for (const timer of this.timers.values())
            clearTimeout(timer);
        this.timers.clear();
        if (this.client?.isOpen)
            this.client.destroy();
    }
    register(key, ttlMs, loader, refreshOnStart = false) {
        this.warmers.set(key, { ttlMs, loader, refreshOnStart });
    }
    diagnostics() {
        return {
            configured: !!this.config.get('REDIS_URL'),
            connected: !!this.client?.isReady,
            ...this.metrics,
        };
    }
    key(key) {
        return `${this.prefix}:${key}`;
    }
    warn() {
        this.metrics.errors++;
        if (Date.now() - this.lastWarning > 30000) {
            this.lastWarning = Date.now();
            this.logger.warn('Redis public cache unavailable; serving catalog data from its source.');
        }
    }
    async command(operation) {
        let timer;
        try {
            return await Promise.race([
                operation(),
                new Promise((_, reject) => {
                    timer = setTimeout(() => reject(new Error('Redis command deadline')), this.commandMs);
                }),
            ]);
        }
        finally {
            clearTimeout(timer);
        }
    }
    decode(value) {
        const json = value.startsWith('gz:')
            ? (0, zlib_1.gunzipSync)(Buffer.from(value.slice(3), 'base64'), {
                maxOutputLength: 2 * 1024 * 1024,
            }).toString('utf8')
            : value;
        return JSON.parse(json);
    }
    getOrLoad(key, ttlMs, loader) {
        const existing = this.pending.get(key);
        if (existing)
            return existing;
        const generation = this.generations.get(key) || 0;
        const promise = this.load(key, ttlMs, loader, generation).finally(() => {
            if (this.pending.get(key) === promise)
                this.pending.delete(key);
        });
        this.pending.set(key, promise);
        return promise;
    }
    async load(key, ttlMs, loader, generation) {
        const client = this.client;
        const dataKey = this.key(key);
        const lockKey = `${dataKey}:fill`;
        const token = (0, crypto_1.randomUUID)();
        let ownsLock = false;
        if (client?.isReady) {
            try {
                const value = await this.command(() => client.get(dataKey));
                if (value !== null) {
                    try {
                        const data = this.decode(value);
                        this.metrics.hits++;
                        return data;
                    }
                    catch {
                        await this.command(() => client.del(dataKey));
                    }
                }
                ownsLock =
                    (await this.command(() => client.set(lockKey, token, { NX: true, PX: 10000 }))) === 'OK';
                if (!ownsLock) {
                    for (let attempt = 0; attempt < 10; attempt++) {
                        await new Promise((resolve) => setTimeout(resolve, 25));
                        const filled = await this.command(() => client.get(dataKey));
                        if (filled !== null) {
                            const data = this.decode(filled);
                            this.metrics.hits++;
                            return data;
                        }
                    }
                }
            }
            catch {
                this.warn();
            }
        }
        this.metrics.misses++;
        try {
            this.metrics.loads++;
            const data = await loader();
            if (ownsLock &&
                client?.isReady &&
                !this.stopped &&
                (this.generations.get(key) || 0) === generation) {
                try {
                    const json = JSON.stringify(data);
                    if (json && Buffer.byteLength(json) <= 2 * 1024 * 1024) {
                        const payload = Buffer.byteLength(json) > 32 * 1024
                            ? `gz:${(0, zlib_1.gzipSync)(json).toString('base64')}`
                            : json;
                        await this.command(() => client.eval(PUBLISH, {
                            keys: [dataKey, lockKey],
                            arguments: [token, payload, String(Math.max(1000, ttlMs))],
                        }));
                    }
                }
                catch {
                    this.warn();
                }
            }
            return data;
        }
        finally {
            if (ownsLock && client?.isReady) {
                try {
                    await this.command(() => client.eval(RELEASE, { keys: [lockKey], arguments: [token] }));
                }
                catch {
                    this.warn();
                }
            }
        }
    }
    async invalidate(key, warm = true) {
        this.generations.set(key, (this.generations.get(key) || 0) + 1);
        this.pending.delete(key);
        if (this.client?.isReady) {
            try {
                await this.command(() => this.client.eval(INVALIDATE, {
                    keys: [this.key(key), `${this.key(key)}:fill`],
                    arguments: [],
                }));
            }
            catch {
                this.warn();
            }
        }
        if (warm && this.bootstrapReady && !this.stopped && this.warmers.has(key)) {
            clearTimeout(this.timers.get(key));
            const timer = setTimeout(() => {
                this.timers.delete(key);
                const task = this.warmers.get(key);
                void this.getOrLoad(key, task.ttlMs, task.loader).catch(() => { });
            }, 200);
            timer.unref();
            this.timers.set(key, timer);
        }
    }
    async warmAll() {
        await Promise.allSettled([...this.warmers].map(async ([key, task]) => {
            if (task.refreshOnStart)
                await this.invalidate(key, false);
            await this.getOrLoad(key, task.ttlMs, task.loader);
        }));
    }
};
exports.PublicCatalogCacheService = PublicCatalogCacheService;
exports.PublicCatalogCacheService = PublicCatalogCacheService = PublicCatalogCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PublicCatalogCacheService);
//# sourceMappingURL=public-catalog-cache.service.js.map