import { OnApplicationBootstrap, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class PublicCatalogCacheService implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private client?;
    private readonly pending;
    private readonly generations;
    private readonly warmers;
    private readonly timers;
    private bootstrapReady;
    private stopped;
    private lastWarning;
    private readonly prefix;
    private readonly commandMs;
    private readonly metrics;
    constructor(config: ConfigService);
    onModuleInit(): void;
    onApplicationBootstrap(): void;
    onModuleDestroy(): void;
    register(key: string, ttlMs: number, loader: () => Promise<unknown>, refreshOnStart?: boolean): void;
    diagnostics(): {
        hits: number;
        misses: number;
        loads: number;
        errors: number;
        configured: boolean;
        connected: boolean;
    };
    private key;
    private warn;
    private command;
    private decode;
    getOrLoad<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T>;
    private load;
    invalidate(key: string, warm?: boolean): Promise<void>;
    private warmAll;
}
