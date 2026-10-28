import { createHash } from 'node:crypto';
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';
import { auditSegments } from './audit-podcast-subtitles.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const defaultBundle = join(projectRoot, 'resources', 'podcast-transcripts');
const maxJsonBytes = 16 * 1024 * 1024;
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const validId = (id) =>
  typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id);

function audit(bytes, duration, id) {
  if (bytes.length > maxJsonBytes)
    throw new Error(`${id}: transcript too large`);
  if (!Number.isFinite(duration) || duration <= 0)
    throw new Error(`${id}: invalid duration`);
  const result = auditSegments(JSON.parse(bytes.toString('utf8')), duration);
  if (result.issues.length)
    throw new Error(
      `${id}: invalid transcript: ${JSON.stringify(result.issues.slice(0, 2))}`,
    );
  return result;
}

export function packageTranscriptBundle(
  reportPath,
  root = projectRoot,
  destination = defaultBundle,
) {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  if (!Array.isArray(report.videos) || !report.videos.length)
    throw new Error('No ready transcripts in report');
  const seen = new Set();
  // Validate the entire input before writing any bundle files.
  const prepared = [...report.videos]
    .sort((a, b) => a.id.localeCompare(b.id, 'en'))
    .map((video) => {
      if (!validId(video.id) || seen.has(video.id))
        throw new Error('Invalid or duplicate video id');
      seen.add(video.id);
      const expected = join(
        resolve(root),
        'storage',
        'featured-videos',
        video.id,
        'transcript-v3.json',
      );
      if (resolve(root, video.file) !== expected)
        throw new Error(`${video.id}: unexpected transcript path`);
      const bytes = readFileSync(expected);
      if (digest(bytes) !== video.sha256)
        throw new Error(
          `${video.id}: input checksum changed; audit it again first`,
        );
      const result = audit(bytes, video.duration, video.id);
      const compressed = gzipSync(bytes, { level: 9 });
      return {
        compressed,
        entry: {
          id: video.id,
          duration: video.duration,
          rows: result.rows,
          jsonBytes: bytes.length,
          gzipBytes: compressed.length,
          sha256: digest(bytes),
          gzipSha256: digest(compressed),
        },
      };
    });
  mkdirSync(destination, { recursive: true });
  for (const { entry, compressed } of prepared) {
    const path = join(destination, `${entry.id}.json.gz`);
    writeFileSync(`${path}.tmp`, compressed);
    renameSync(`${path}.tmp`, path);
  }
  const manifest = {
    version: 1,
    count: prepared.length,
    rows: prepared.reduce((n, item) => n + item.entry.rows, 0),
    videos: prepared.map((item) => item.entry),
  };
  const path = join(destination, 'manifest.json');
  writeFileSync(`${path}.tmp`, JSON.stringify(manifest, null, 2) + '\n');
  renameSync(`${path}.tmp`, path);
  return verifyTranscriptBundle(destination);
}

export function verifyTranscriptBundle(directory = defaultBundle) {
  const manifest = JSON.parse(
    readFileSync(join(directory, 'manifest.json'), 'utf8'),
  );
  if (
    manifest.version !== 1 ||
    !Array.isArray(manifest.videos) ||
    !manifest.videos.length ||
    manifest.count !== manifest.videos.length
  )
    throw new Error('Invalid transcript bundle manifest');
  const seen = new Set();
  let rows = 0,
    gzipBytes = 0;
  const expectedFiles = new Set([
    'manifest.json',
    ...manifest.videos.map((entry) => `${entry.id}.json.gz`),
  ]);
  if (readdirSync(directory).some((name) => !expectedFiles.has(name)))
    throw new Error('Unexpected file in transcript bundle');
  for (const entry of manifest.videos) {
    if (!validId(entry.id) || seen.has(entry.id))
      throw new Error('Invalid or duplicate bundled id');
    seen.add(entry.id);
    const compressed = readFileSync(join(directory, `${entry.id}.json.gz`));
    if (
      compressed.length !== entry.gzipBytes ||
      digest(compressed) !== entry.gzipSha256
    )
      throw new Error(`${entry.id}: compressed checksum mismatch`);
    const bytes = gunzipSync(compressed, { maxOutputLength: maxJsonBytes });
    if (bytes.length !== entry.jsonBytes || digest(bytes) !== entry.sha256)
      throw new Error(`${entry.id}: transcript checksum mismatch`);
    const result = audit(bytes, entry.duration, entry.id);
    if (result.rows !== entry.rows)
      throw new Error(`${entry.id}: row count mismatch`);
    rows += result.rows;
    gzipBytes += compressed.length;
  }
  if (rows !== manifest.rows) throw new Error('Bundle row count mismatch');
  return { videos: manifest.count, rows, gzipBytes };
}

export function copyTranscriptBundle(outputRoot = join(projectRoot, 'dist')) {
  const result = verifyTranscriptBundle();
  const destination = join(outputRoot, 'resources', 'podcast-transcripts');
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(defaultBundle, destination, { recursive: true });
  return result;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const args = process.argv.slice(2);
    let result;
    if (!args.length || args[0] === '--verify')
      result = verifyTranscriptBundle();
    else if (args.length === 2 && args[0] === '--from-report')
      result = packageTranscriptBundle(resolve(args[1]));
    else if (args.length === 1 && args[0] === '--copy-to-dist')
      result = copyTranscriptBundle();
    else
      throw new Error(
        'Usage: node scripts/podcast-transcript-bundle.mjs [--verify | --from-report REPORT | --copy-to-dist]',
      );
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
