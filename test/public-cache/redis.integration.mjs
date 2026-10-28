import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { createClient } = require('redis');
const { ConfigService } = require('@nestjs/config');
const {
  PublicCatalogCacheService,
} = require('../../dist/src/public-cache/public-catalog-cache.service');
const url = process.env.REDIS_TEST_URL || process.env.REDIS_URL;
if (!url)
  throw new Error('Set REDIS_TEST_URL or REDIS_URL for this integration test.');
const prefix = `hihienglish:test:${randomUUID()}`;
const config = new ConfigService({
  REDIS_URL: url,
  REDIS_CACHE_PREFIX: prefix,
  REDIS_COMMAND_TIMEOUT_MS: 150,
});
const a = new PublicCatalogCacheService(config),
  b = new PublicCatalogCacheService(config);
const client = createClient({ url });
client.on('error', () => {});
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  a.onModuleInit();
  b.onModuleInit();
  await client.connect();
  const start = Date.now();
  while (!a.diagnostics().connected || !b.diagnostics().connected) {
    if (Date.now() - start > 5000)
      throw new Error('Redis test connection deadline');
    await pause(20);
  }
  let loads = 0;
  const load = async () => {
    loads++;
    await pause(80);
    return [{ id: 'visible', title: 'Public' }];
  };
  const result = await Promise.all(
    Array.from({ length: 30 }, (_, i) =>
      (i % 2 ? a : b).getOrLoad('shared', 300000, load),
    ),
  );
  assert.equal(loads, 1);
  assert.ok(result.every((r) => r[0].id === 'visible'));
  assert.ok((await client.pTTL(`${prefix}:shared`)) > 0);
  let finish;
  const old = a.getOrLoad(
    'race',
    300000,
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  while (!finish) await pause(5);
  await b.invalidate('race', false);
  await b.getOrLoad('race', 300000, async () => ['new']);
  finish(['old']);
  await old;
  assert.deepEqual(await a.getOrLoad('race', 300000, async () => ['wrong']), [
    'new',
  ]);
  let ttlLoads = 0;
  await a.getOrLoad('ttl', 1000, async () => ++ttlLoads);
  await pause(1100);
  assert.equal(await b.getOrLoad('ttl', 1000, async () => ++ttlLoads), 2);
  await client.set(`${prefix}:corrupt`, 'broken', { PX: 1000 });
  assert.deepEqual(
    await a.getOrLoad('corrupt', 1000, async () => ['recovered']),
    ['recovered'],
  );
  const stats = {
    sharedRequests: 30,
    sourceLoads: loads,
    crossProcessInvalidation: 'passed',
    ttlExpiry: 'passed',
    corruptPayload: 'passed',
    a: a.diagnostics(),
    b: b.diagnostics(),
  };
  writeFileSync(
    'output/redis-cache-integration.json',
    JSON.stringify(stats, null, 2),
  );
  console.log(JSON.stringify(stats));
} finally {
  a.onModuleDestroy();
  b.onModuleDestroy();
  if (client.isReady)
    await client.del(
      ['shared', 'race', 'ttl', 'corrupt'].flatMap((key) => [
        `${prefix}:${key}`,
        `${prefix}:${key}:fill`,
      ]),
    );
  if (client.isOpen) client.destroy();
}
