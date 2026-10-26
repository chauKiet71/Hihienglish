import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createPgPool } = require('../dist/src/prisma/pg-pool.js');
const pool = createPgPool(process.env.DATABASE_URL);
try {
  const before = await pool.query(
    'SELECT video_id, is_premium, preview_seconds FROM podcast_access ORDER BY video_id',
  );
  await pool.query(
    await readFile(
      new URL(
        '../prisma/updates/20261026_podcast_catalog.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const after = await pool.query(
    'SELECT video_id, is_premium, preview_seconds FROM podcast_access ORDER BY video_id',
  );
  if (JSON.stringify(before.rows) !== JSON.stringify(after.rows))
    throw new Error('Premium policies changed unexpectedly.');
  console.log(
    'Podcast catalog migration applied. Existing Premium policies unchanged. Seed runs on backend startup.',
  );
} finally {
  await pool.end();
}
