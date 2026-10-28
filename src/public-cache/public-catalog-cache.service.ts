import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';
import { createClient } from 'redis';

const PUBLISH = `if redis.call('GET', KEYS[2]) == ARGV[1] then redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3]); redis.call('DEL', KEYS[2]); return 1 end; return 0`;
const RELEASE = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end; return 0`;
const INVALIDATE = `return redis.call('DEL', KEYS[1], KEYS[2])`;
type WarmTask = {
  ttlMs: number;
  loader: () => Promise<unknown>;
  refreshOnStart: boolean;
};

@Injectable()
export class PublicCatalogCacheService
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(PublicCatalogCacheService.name);
  private client?: ReturnType<typeof createClient>;
  private readonly pending = new Map<string, Promise<unknown>>();
  private readonly generations = new Map<string, number>();
  private readonly warmers = new Map<string, WarmTask>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private bootstrapReady = false;
  private stopped = false;
  private lastWarning = 0;
  private readonly prefix: string;
  private readonly commandMs: number;
  private readonly metrics = { hits: 0, misses: 0, loads: 0, errors: 0 };

  constructor(private readonly config: ConfigService) {
    this.prefix =
      config.get<string>('REDIS_CACHE_PREFIX') ||
      `hihienglish:${process.env.NODE_ENV || 'development'}:public:v1`;
    this.commandMs = Math.max(
      20,
      Math.min(1000, Number(config.get('REDIS_COMMAND_TIMEOUT_MS')) || 150),
    );
  }

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) return;
    try {
      this.client = createClient({
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
        if (this.bootstrapReady) void this.warmAll();
      });
      void this.client.connect().catch(() => this.warn());
    } catch {
      this.warn();
    }
  }

  onApplicationBootstrap() {
    this.bootstrapReady = true;
    if (this.client?.isReady) void this.warmAll();
  }

  onModuleDestroy() {
    this.stopped = true;
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    if (this.client?.isOpen) this.client.destroy();
  }

  register(
    key: string,
    ttlMs: number,
    loader: () => Promise<unknown>,
    refreshOnStart = false,
  ) {
    this.warmers.set(key, { ttlMs, loader, refreshOnStart });
  }

  diagnostics() {
    return {
      configured: !!this.config.get('REDIS_URL'),
      connected: !!this.client?.isReady,
      ...this.metrics,
    };
  }

  private key(key: string) {
    return `${this.prefix}:${key}`;
  }
  private warn() {
    this.metrics.errors++;
    if (Date.now() - this.lastWarning > 30000) {
      this.lastWarning = Date.now();
      this.logger.warn(
        'Redis public cache unavailable; serving catalog data from its source.',
      );
    }
  }

  private async command<T>(operation: () => Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Redis command deadline')),
            this.commandMs,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  private decode<T>(value: string): T {
    const json = value.startsWith('gz:')
      ? gunzipSync(Buffer.from(value.slice(3), 'base64'), {
          maxOutputLength: 2 * 1024 * 1024,
        }).toString('utf8')
      : value;
    return JSON.parse(json) as T;
  }

  getOrLoad<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) return existing as Promise<T>;
    const generation = this.generations.get(key) || 0;
    const promise = this.load(key, ttlMs, loader, generation).finally(() => {
      if (this.pending.get(key) === promise) this.pending.delete(key);
    });
    this.pending.set(key, promise);
    return promise;
  }

  private async load<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>,
    generation: number,
  ): Promise<T> {
    const client = this.client;
    const dataKey = this.key(key);
    const lockKey = `${dataKey}:fill`;
    const token = randomUUID();
    let ownsLock = false;
    if (client?.isReady) {
      try {
        const value = await this.command(() => client.get(dataKey));
        if (value !== null) {
          try {
            const data = this.decode<T>(value);
            this.metrics.hits++;
            return data;
          } catch {
            await this.command(() => client.del(dataKey));
          }
        }
        ownsLock =
          (await this.command(() =>
            client.set(lockKey, token, { NX: true, PX: 10000 }),
          )) === 'OK';
        if (!ownsLock) {
          // Another process is filling it. Wait briefly, then fall back to the source.
          for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 25));
            const filled = await this.command(() => client.get(dataKey));
            if (filled !== null) {
              const data = this.decode<T>(filled);
              this.metrics.hits++;
              return data;
            }
          }
        }
      } catch {
        this.warn();
      }
    }
    this.metrics.misses++;
    try {
      this.metrics.loads++;
      const data = await loader();
      if (
        ownsLock &&
        client?.isReady &&
        !this.stopped &&
        (this.generations.get(key) || 0) === generation
      ) {
        try {
          const json = JSON.stringify(data);
          if (json && Buffer.byteLength(json) <= 2 * 1024 * 1024) {
            const payload =
              Buffer.byteLength(json) > 32 * 1024
                ? `gz:${gzipSync(json).toString('base64')}`
                : json;
            // Invalidating a key also removes its fill token; an old DB read cannot republish it.
            await this.command(() =>
              client.eval(PUBLISH, {
                keys: [dataKey, lockKey],
                arguments: [token, payload, String(Math.max(1000, ttlMs))],
              }),
            );
          }
        } catch {
          this.warn();
        }
      }
      return data;
    } finally {
      if (ownsLock && client?.isReady) {
        try {
          await this.command(() =>
            client.eval(RELEASE, { keys: [lockKey], arguments: [token] }),
          );
        } catch {
          this.warn();
        }
      }
    }
  }

  async invalidate(key: string, warm = true) {
    this.generations.set(key, (this.generations.get(key) || 0) + 1);
    this.pending.delete(key);
    if (this.client?.isReady) {
      try {
        await this.command(() =>
          this.client!.eval(INVALIDATE, {
            keys: [this.key(key), `${this.key(key)}:fill`],
            arguments: [],
          }),
        );
      } catch {
        this.warn();
      }
    }
    if (warm && this.bootstrapReady && !this.stopped && this.warmers.has(key)) {
      clearTimeout(this.timers.get(key));
      const timer = setTimeout(() => {
        this.timers.delete(key);
        const task = this.warmers.get(key)!;
        void this.getOrLoad(key, task.ttlMs, task.loader).catch(() => {});
      }, 200);
      timer.unref();
      this.timers.set(key, timer);
    }
  }

  private async warmAll() {
    await Promise.allSettled(
      [...this.warmers].map(async ([key, task]) => {
        if (task.refreshOnStart) await this.invalidate(key, false);
        await this.getOrLoad(key, task.ttlMs, task.loader);
      }),
    );
  }
}
