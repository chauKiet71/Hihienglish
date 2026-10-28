import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { gzipSync } from 'zlib';
import { PublicCatalogCacheService } from './public-catalog-cache.service';

jest.mock('redis', () => ({ createClient: jest.fn() }));

describe('Public catalog Redis cache', () => {
  let redis: {
    isReady: boolean;
    isOpen: boolean;
    on: jest.Mock;
    connect: jest.Mock;
    destroy: jest.Mock;
    get: jest.Mock;
    set: jest.Mock;
    eval: jest.Mock;
    del: jest.Mock;
  };
  let cache: PublicCatalogCacheService;
  function setup(url?: string) {
    cache = new PublicCatalogCacheService(
      new ConfigService({
        REDIS_URL: url,
        REDIS_CACHE_PREFIX: 'unit:catalog',
        REDIS_COMMAND_TIMEOUT_MS: 20,
      }),
    );
    cache.onModuleInit();
    return cache;
  }
  beforeEach(() => {
    redis = {
      isReady: true,
      isOpen: true,
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn(),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue(1),
      del: jest.fn().mockResolvedValue(1),
    };
    jest.mocked(createClient).mockReturnValue(redis as never);
  });
  afterEach(() => {
    cache.onModuleDestroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('coalesces concurrent source requests when Redis is not configured', async () => {
    setup();
    const load = jest.fn(async () => ['public']);
    expect(
      await Promise.all(
        Array.from({ length: 20 }, () =>
          cache.getOrLoad('catalog', 300000, load),
        ),
      ),
    ).toEqual(Array(20).fill(['public']));
    expect(load).toHaveBeenCalledTimes(1);
    expect(redis.get).not.toHaveBeenCalled();
  });
  it('serves shared Redis hits without reading the source', async () => {
    setup('redis://localhost');
    redis.get.mockResolvedValue(JSON.stringify([{ id: 'visible' }]));
    const load = jest.fn();
    expect(await cache.getOrLoad('catalog', 300000, load)).toEqual([
      { id: 'visible' },
    ]);
    expect(load).not.toHaveBeenCalled();
    expect(cache.diagnostics().hits).toBe(1);
  });
  it('bounds value TTL and publishes only while holding its fill token', async () => {
    setup('redis://localhost');
    await cache.getOrLoad('catalog', 300000, async () => ['value']);
    expect(redis.set).toHaveBeenCalledWith(
      'unit:catalog:catalog:fill',
      expect.any(String),
      { NX: true, PX: 10000 },
    );
    const publish = redis.eval.mock.calls.find(([script]) =>
      script.includes("'SET'"),
    );
    expect(publish?.[1].arguments).toEqual([
      expect.any(String),
      JSON.stringify(['value']),
      '300000',
    ]);
  });
  it('does not republish a DB read invalidated while in flight', async () => {
    setup('redis://localhost');
    let finish!: (value: string[]) => void;
    const pending = cache.getOrLoad(
      'catalog',
      300000,
      () =>
        new Promise<string[]>((resolve) => {
          finish = resolve;
        }),
    );
    while (!finish) await Promise.resolve();
    await cache.invalidate('catalog', false);
    finish(['old']);
    await pending;
    expect(
      redis.eval.mock.calls.filter(([script]) => script.includes("'SET'")),
    ).toHaveLength(0);
    expect(
      await cache.getOrLoad('catalog', 300000, async () => ['new']),
    ).toEqual(['new']);
    expect(
      redis.eval.mock.calls.filter(([script]) => script.includes("'SET'")),
    ).toHaveLength(1);
  });
  it('falls back after a bounded deadline when an open socket stops replying', async () => {
    setup('redis://localhost');
    redis.get.mockReturnValue(new Promise(() => {}));
    const start = Date.now();
    expect(
      await cache.getOrLoad('catalog', 300000, async () => ['fallback']),
    ).toEqual(['fallback']);
    expect(Date.now() - start).toBeLessThan(500);
    expect(cache.diagnostics().errors).toBeGreaterThan(0);
  });
  it('does not retain a failed source request', async () => {
    setup();
    await expect(
      cache.getOrLoad('catalog', 300000, async () => {
        throw new Error('DB unavailable');
      }),
    ).rejects.toThrow('DB unavailable');
    expect(
      await cache.getOrLoad('catalog', 300000, async () => ['retry']),
    ).toEqual(['retry']);
  });
  it('recovers corrupted payloads and handles compressed public lists', async () => {
    setup('redis://localhost');
    redis.get.mockResolvedValueOnce('not-json');
    expect(
      await cache.getOrLoad('catalog', 300000, async () => ['rebuilt']),
    ).toEqual(['rebuilt']);
    expect(redis.del).toHaveBeenCalledWith('unit:catalog:catalog');
    redis.get.mockResolvedValue(
      `gz:${gzipSync(JSON.stringify(['compressed'])).toString('base64')}`,
    );
    expect(
      await cache.getOrLoad('catalog', 300000, async () => ['wrong']),
    ).toEqual(['compressed']);
  });
  it('starts warmup without blocking application bootstrap', async () => {
    setup('redis://localhost');
    let finish!: (value: string[]) => void;
    cache.register(
      'catalog',
      300000,
      () =>
        new Promise<string[]>((resolve) => {
          finish = resolve;
        }),
    );
    expect(cache.onApplicationBootstrap()).toBeUndefined();
    while (!finish) await Promise.resolve();
    finish(['warmed']);
    await cache.getOrLoad('catalog', 300000, async () => ['wrong']);
  });
});
