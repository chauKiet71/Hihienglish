// Uses a disposable PostgreSQL schema. Never writes into the application's tables.
import 'dotenv/config';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { createPgPool } = require('../../dist/src/prisma/pg-pool.js');
const {
  PodcastCatalogService,
} = require('../../dist/src/podcast/podcast-catalog.service.js');
const {
  PodcastImportService,
} = require('../../dist/src/podcast/podcast-import.service.js');
const {
  PodcastAccessService,
} = require('../../dist/src/podcast/podcast-access.service.js');
const schema = `catalog_test_${randomUUID().replaceAll('-', '')}`;
const pool = createPgPool(process.env.DATABASE_URL);
const client = await pool.connect();
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool, { schema }),
  transactionOptions: { maxWait: 15_000, timeout: 20_000 },
});
let importer;
try {
  await client.query(`CREATE SCHEMA "${schema}"`);
  await client.query(`SET search_path TO "${schema}"`);
  await client.query(
    await readFile(
      new URL(
        '../../prisma/updates/20261026_podcast_catalog.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  await client.query(
    'CREATE TABLE podcast_access (video_id TEXT PRIMARY KEY, is_premium BOOLEAN NOT NULL DEFAULT false, preview_seconds INTEGER NOT NULL DEFAULT 120, created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP)',
  );
  const youtubeChannelId = 'UCcvjK35lDPZTlkIrrwxpepg';
  const extraChannelId = 'UC0000000000000000000000';
  let metadataChannelId = youtubeChannelId;
  let manualId = 'manual00001';
  const candidate = (id) => ({
    id,
    title: `Imported ${id}`,
    duration: 80,
    publishedAt: '2026-01-01T00:00:00Z',
    youtubeChannelId: metadataChannelId,
  });
  let page = {
    ids: ['newvideo001', 'H5qcIEH1iVs', 'oldvideo001', 'oldvideo002'],
  };
  let fail = false;
  const youtube = {
    configured: true,
    channel: async (input) =>
      input === '@ExtraChannel'
        ? {
            youtubeChannelId: extraChannelId,
            name: 'Extra Channel',
            handle: '@ExtraChannel',
            url: `https://www.youtube.com/channel/${extraChannelId}`,
            description: '',
            avatarUrl: 'https://example.test/avatar.jpg',
            uploadsPlaylistId: 'extra-uploads',
          }
        : { uploadsPlaylistId: 'uploads' },
    page: async () => {
      if (fail) throw new Error('Provider unavailable');
      return page;
    },
    videos: async (ids) => ids.map(candidate),
    video: async () => candidate(manualId),
  };
  const catalog = new PodcastCatalogService(prisma, youtube);
  await catalog.onModuleInit();
  const initial = (await catalog.list()).reduce(
    (sum, channel) => sum + channel.videos.length,
    0,
  );
  assert.equal(initial, 145);
  await prisma.podcastAccess.create({
    data: { videoId: 'H5qcIEH1iVs', isPremium: true, previewSeconds: 20 },
  });
  await catalog.setVideoVisible('H5qcIEH1iVs', false);
  await catalog.onModuleInit();
  await assert.rejects(catalog.findVideo('H5qcIEH1iVs'));
  assert.equal(
    (
      await prisma.podcastAccess.findUnique({
        where: { videoId: 'H5qcIEH1iVs' },
      })
    ).previewSeconds,
    20,
  );
  await catalog.setVideoVisible('H5qcIEH1iVs', true);
  importer = new PodcastImportService(prisma, youtube);
  const run = async () => {
    await importer.drain();
  };
  let job = await importer.create('volka-english', 'OLDER', 30);
  const active = await Promise.allSettled([
    importer.create('volka-english', 'OLDER', 30),
    importer.create('volka-english', 'NEWER', 20),
  ]);
  assert(active.every((result) => result.status === 'rejected'));
  await run();
  job = await importer.get(job.id);
  assert.equal(job.status, 'READY');
  assert.deepEqual(
    job.candidates.map((video) => video.id),
    ['oldvideo001', 'oldvideo002'],
  );
  assert.equal(await prisma.podcastVideo.count(), initial);
  await assert.rejects(importer.commit(job.id, ['arbitrary01']));
  assert.equal(
    (await importer.commit(job.id, ['oldvideo001'])).importedCount,
    1,
  );
  assert.equal(
    (await importer.commit(job.id, ['oldvideo001'])).importedCount,
    1,
  );
  assert.equal(await prisma.podcastVideo.count(), initial + 1);
  const access = new PodcastAccessService(prisma, catalog);
  await access.setAccess('oldvideo001', true, 20);
  assert.equal(
    (await access.getPlaybackAccess('oldvideo001')).previewLimitSeconds,
    20,
  );
  assert.equal(
    (await catalog.findVideo('oldvideo001')).lessonPath,
    '/kenh/volka-english/video/oldvideo001',
  );
  job = await importer.create('volka-english', 'OLDER', 30);
  await run();
  job = await importer.get(job.id);
  assert.deepEqual(
    job.candidates.map((video) => video.id),
    ['oldvideo002'],
  );
  await importer.commit(job.id, ['oldvideo002']);
  job = await importer.create('volka-english', 'NEWER', 20);
  await run();
  job = await importer.get(job.id);
  assert.deepEqual(
    job.candidates.map((video) => video.id),
    ['newvideo001'],
  );
  await importer.commit(job.id, ['newvideo001']);
  assert.equal(
    (await catalog.list()).find((channel) => channel.id === 'volka-english')
      .videos[0].id,
    'newvideo001',
  );
  await catalog.setChannelVisible('volka-english', false);
  assert(
    !(await catalog.list()).some((channel) => channel.id === 'volka-english'),
  );
  await assert.rejects(access.getPlaybackAccess('oldvideo001'));
  assert(
    (await catalog.list(true)).some(
      (channel) => channel.id === 'volka-english',
    ),
  );
  await catalog.setChannelVisible('volka-english', true);
  job = await importer.create('volka-english', 'OLDER', 5);
  await prisma.podcastImportJob.update({
    where: { id: job.id },
    data: {
      status: 'RUNNING',
      leaseToken: 'crashed-worker',
      leaseUntil: new Date(0),
    },
  });
  fail = true;
  await run();
  assert.equal((await importer.get(job.id)).status, 'FAILED');
  fail = false;
  page = { ids: [] };
  job = await importer.create('volka-english', 'OLDER', 5);
  await run();
  assert.equal((await importer.get(job.id)).status, 'READY');
  job = await importer.create(
    'volka-english',
    'URL',
    1,
    'https://youtu.be/manual00001',
  );
  await run();
  assert.equal((await importer.get(job.id)).candidates[0].id, 'manual00001');
  await Promise.all([
    importer.commit(job.id, ['manual00001']),
    importer.commit(job.id, ['manual00001']),
  ]);
  assert.equal(
    await prisma.podcastVideo.count({ where: { id: 'manual00001' } }),
    1,
  );
  const extra = await catalog.addChannel('@ExtraChannel');
  assert.equal(extra.id, extraChannelId);
  await assert.rejects(catalog.addChannel('@ExtraChannel'));
  job = await importer.create(
    extra.id,
    'URL',
    1,
    'https://youtu.be/manual00001',
  );
  await run();
  assert.equal((await importer.get(job.id)).status, 'FAILED');
  assert.match((await importer.get(job.id)).errorMessage, /không thuộc kênh/);
  metadataChannelId = extraChannelId;
  manualId = 'manual00002';
  job = await importer.create(
    extra.id,
    'URL',
    1,
    'https://youtu.be/manual00002',
  );
  await run();
  await importer.commit(job.id, ['manual00002']);
  assert.equal(
    (await catalog.findVideo('manual00002')).lessonPath,
    `/podcast?channel=${extra.id}&v=manual00002`,
  );
  console.log(
    'Catalog PostgreSQL integration passed: seed, selection, idempotency, parallel submissions, newer/older modes, restart recovery, visibility and imported-video Premium.',
  );
} finally {
  importer?.onModuleDestroy();
  await prisma.$disconnect();
  await client.query(`SET search_path TO public`);
  // Exact random test-only schema, created above; never computed from user input.
  if (!/^catalog_test_[a-f0-9]{32}$/.test(schema))
    throw new Error('Invalid test schema');
  await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  client.release();
  await pool.end();
}
