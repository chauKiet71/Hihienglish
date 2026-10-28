import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import {
  packageTranscriptBundle,
  verifyTranscriptBundle,
} from '../scripts/podcast-transcript-bundle.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'hihienglish-transcript-bundle-'));
  t.after(() => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.ok(
      root.startsWith(join(tmpdir(), 'hihienglish-transcript-bundle-')),
    );
    rmSync(root, { recursive: true });
  });
  const id = 'sample00001';
  const file = `storage/featured-videos/${id}/transcript-v3.json`;
  mkdirSync(dirname(join(root, file)), { recursive: true });
  const bytes = Buffer.from(
    JSON.stringify([{ start: 0, end: 2, en: 'Hello.', vi: 'Xin chào.' }]),
  );
  writeFileSync(join(root, file), bytes);
  const report = {
    videos: [
      {
        id,
        file,
        duration: 10,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      },
    ],
  };
  const reportPath = join(root, 'ready.json');
  const save = () => writeFileSync(reportPath, JSON.stringify(report));
  save();
  return {
    root,
    id,
    file,
    report,
    reportPath,
    save,
    bundle: join(root, 'resources', 'podcast-transcripts'),
  };
}

test('packages only verified ready data and remains byte-identical on repeat', (t) => {
  const f = fixture(t);
  assert.equal(
    packageTranscriptBundle(f.reportPath, f.root, f.bundle).videos,
    1,
  );
  const first = readFileSync(join(f.bundle, 'manifest.json'));
  const compressed = readFileSync(join(f.bundle, `${f.id}.json.gz`));
  packageTranscriptBundle(f.reportPath, f.root, f.bundle);
  assert.deepEqual(readFileSync(join(f.bundle, 'manifest.json')), first);
  assert.deepEqual(readFileSync(join(f.bundle, `${f.id}.json.gz`)), compressed);
  assert.equal(verifyTranscriptBundle(f.bundle).rows, 1);
});
test('detects damaged deployment data before a build succeeds', (t) => {
  const f = fixture(t);
  packageTranscriptBundle(f.reportPath, f.root, f.bundle);
  const target = join(f.bundle, `${f.id}.json.gz`);
  const bytes = readFileSync(target);
  bytes[10] ^= 1;
  writeFileSync(target, bytes);
  assert.throws(() => verifyTranscriptBundle(f.bundle), /checksum/);
});
test('rejects changed, unaudited source without writing a bundle', (t) => {
  const f = fixture(t);
  writeFileSync(join(f.root, f.file), 'changed');
  assert.throws(
    () => packageTranscriptBundle(f.reportPath, f.root, f.bundle),
    /checksum changed/,
  );
  assert.equal(existsSync(f.bundle), false);
});
test('refuses an input path outside the approved transcript store', (t) => {
  const f = fixture(t);
  f.report.videos[0].file = '.env';
  f.save();
  assert.throws(
    () => packageTranscriptBundle(f.reportPath, f.root, f.bundle),
    /unexpected transcript path/,
  );
  assert.equal(existsSync(f.bundle), false);
});
test('rejects duplicate video ids', (t) => {
  const f = fixture(t);
  f.report.videos.push({ ...f.report.videos[0] });
  f.save();
  assert.throws(
    () => packageTranscriptBundle(f.reportPath, f.root, f.bundle),
    /duplicate/,
  );
  assert.equal(existsSync(f.bundle), false);
});
test('excludes arbitrary files and credentials from a deployment bundle', (t) => {
  const f = fixture(t);
  packageTranscriptBundle(f.reportPath, f.root, f.bundle);
  writeFileSync(join(f.bundle, '.env'), 'not-a-real-secret');
  assert.throws(() => verifyTranscriptBundle(f.bundle), /Unexpected file/);
});
