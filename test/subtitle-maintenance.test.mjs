import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import {
  auditSegments,
  readCachedTranscript,
  repairWordTimingWindows,
  writeVerifiedTranscript,
  parseOptions,
  selectQueue,
  isProviderCreditExhausted,
} from '../scripts/audit-podcast-subtitles.mjs';

const healthy = [{ start: 0, end: 2, en: 'Hello there.', vi: 'Xin chào.' }];
const scratch = resolve('node_modules/.cache/subtitle-maintenance');

test('stops for exhausted credits while distinguishing temporary rate limits', () => {
  assert.equal(
    isProviderCreditExhausted(new Error('429 You have no credits remaining.')),
    true,
  );
  assert.equal(
    isProviderCreditExhausted(new Error('429 insufficient_quota')),
    true,
  );
  assert.equal(
    isProviderCreditExhausted(
      new Error('429 Rate limit reached; retry later.'),
    ),
    false,
  );
});

test('creates missing subtitles only when explicitly selected and never requeues valid caches', () => {
  const rows = [
    { state: 'MISSING', duration: 60 },
    { state: 'OK', duration: 30 },
    { state: 'REPAIR', duration: 120 },
  ];
  assert.deepEqual(selectQueue(rows, parseOptions(['--apply'])), [rows[2]]);
  assert.deepEqual(
    selectQueue(
      rows,
      parseOptions(['--apply', '--include-missing', '--limit=1']),
    ),
    [rows[0]],
  );
});
test('bounds bulk worker concurrency and rejects unknown command options', () => {
  assert.equal(parseOptions(['--workers=3']).workers, 3);
  for (const arg of ['--workers=0', '--workers=4', '--limit=0', '--unknown'])
    assert.throws(() => parseOptions([arg]), /Usage/);
});
function withDirectory(run) {
  mkdirSync(scratch, { recursive: true });
  const directory = mkdtempSync(join(scratch, 'test-'));
  try {
    run(directory);
  } finally {
    assert.ok(
      resolve(directory).startsWith(scratch + '\\') ||
        resolve(directory).startsWith(scratch + '/'),
    );
    rmSync(directory, { recursive: true, force: true });
  }
}

test('accepts a bilingual transcript and flags oversized paragraphs', () => {
  assert.equal(auditSegments(healthy, 10).issues.length, 0);
  const audit = auditSegments(
    [{ ...healthy[0], end: 120, en: Array(300).fill('word').join(' ') }],
    120,
  );
  assert.deepEqual(audit.issues[0].reasons, ['words', 'duration']);
});
test('detects missing translations, overlapping rows and out-of-video timings', () => {
  const audit = auditSegments(
    [...healthy, { start: 1, end: 12, en: 'Next.', vi: '' }],
    10,
  );
  assert.deepEqual(audit.issues[0].reasons, ['text', 'timing', 'overlap']);
});
test('repairs a zero-length final word without changing text or translations', () => {
  const rows = [
    {
      ...healthy[0],
      words: [
        { text: 'Hello', start: 0, end: 0.8 },
        { text: 'there.', start: 1, end: 1 },
      ],
    },
  ];
  assert.deepEqual(auditSegments(rows, 10).issues[0].reasons, ['word-timing']);
  const fixed = repairWordTimingWindows(rows);
  assert.equal(fixed[0].words[1].end, 2);
  assert.deepEqual(fixed[0].words[0], rows[0].words[0]);
  assert.equal(fixed[0].en, rows[0].en);
  assert.equal(fixed[0].vi, rows[0].vi);
  assert.equal(auditSegments(fixed, 10).issues.length, 0);
});

test('clips a final word that exceeds the video endpoint while preserving bilingual content', () => {
  const rows = [
    {
      ...healthy[0],
      words: [
        { text: 'Hello', start: 0, end: 1 },
        { text: 'there.', start: 1, end: 2.04 },
      ],
    },
  ];
  assert.deepEqual(auditSegments(rows, 2).issues[0].reasons, ['word-timing']);
  const fixed = repairWordTimingWindows(rows);
  assert.equal(fixed[0].words[1].end, 2);
  assert.equal(fixed[0].en, rows[0].en);
  assert.equal(fixed[0].vi, rows[0].vi);
  assert.equal(auditSegments(fixed, 2).issues.length, 0);
});
test('refuses invalid replacement before touching either cache', () =>
  withDirectory((directory) => {
    const original = JSON.stringify(healthy);
    for (const version of [2, 3])
      writeFileSync(join(directory, `transcript-v${version}.json`), original);
    assert.throws(
      () => writeVerifiedTranscript(directory, [{ ...healthy[0], vi: '' }], 10),
      /validation/,
    );
    for (const version of [2, 3])
      assert.equal(
        readFileSync(join(directory, `transcript-v${version}.json`), 'utf8'),
        original,
      );
    assert.equal(readdirSync(directory).length, 2);
  }));
test('publishes valid v3 atomically, preserves v2 and backs up the previous v3', () =>
  withDirectory((directory) => {
    const original = JSON.stringify(healthy);
    for (const version of [2, 3])
      writeFileSync(join(directory, `transcript-v${version}.json`), original);
    const updated = [{ ...healthy[0], vi: 'Chào bạn.' }];
    writeVerifiedTranscript(directory, updated, 10);
    assert.equal(
      readFileSync(join(directory, 'transcript-v2.json'), 'utf8'),
      original,
    );
    assert.deepEqual(
      JSON.parse(readFileSync(join(directory, 'transcript-v3.json'), 'utf8')),
      updated,
    );
    const backup = readdirSync(directory).find((name) =>
      name.startsWith('transcript-v3.json.backup-'),
    );
    assert.equal(readFileSync(join(directory, backup), 'utf8'), original);
    assert.ok(!readdirSync(directory).some((name) => name.endsWith('.tmp')));
  }));
test('reports absent and malformed caches without treating them as valid', () =>
  withDirectory((directory) => {
    assert.equal(readCachedTranscript(directory, 10), null);
    writeFileSync(join(directory, 'transcript-v2.json'), '{broken');
    assert.equal(
      readCachedTranscript(directory, 10).issues[0].reason,
      'malformed',
    );
  }));
