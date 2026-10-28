import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);

export function auditSegments(segments, duration) {
  const issues = [];
  let maxWords = 0;
  let maxSeconds = 0;
  if (!Array.isArray(segments) || !segments.length)
    return { rows: 0, maxWords, maxSeconds, issues: [{ reason: 'empty' }] };
  segments.forEach((segment, index) => {
    const words = String(segment?.en || '')
      .split(/\s+/)
      .filter(Boolean).length;
    maxWords = Math.max(maxWords, words);
    const seconds = segment?.end - segment?.start;
    if (Number.isFinite(seconds)) maxSeconds = Math.max(maxSeconds, seconds);
    const reasons = [];
    if (words > 40) reasons.push('words');
    if (seconds > 18.001 && words >= 8) reasons.push('duration');
    if (
      typeof segment?.en !== 'string' ||
      !segment.en.trim() ||
      typeof segment?.vi !== 'string' ||
      !segment.vi.trim()
    )
      reasons.push('text');
    if (
      !Number.isFinite(segment?.start) ||
      !Number.isFinite(segment?.end) ||
      segment.start < 0 ||
      seconds <= 0 ||
      segment.end > duration + 0.001
    )
      reasons.push('timing');
    if (index && segment?.start < segments[index - 1]?.end - 0.001)
      reasons.push('overlap');
    if (
      segment?.words?.some(
        (word) =>
          !Number.isFinite(word.start) ||
          !Number.isFinite(word.end) ||
          word.end <= word.start ||
          word.start < segment.start - 0.001 ||
          word.end > segment.end + 0.001,
      )
    )
      reasons.push('word-timing');
    if (reasons.length)
      issues.push({
        index,
        start: segment?.start,
        end: segment?.end,
        words,
        reasons,
      });
  });
  return { rows: segments.length, maxWords, maxSeconds, issues };
}

export function readCachedTranscript(directory, duration) {
  for (const version of [3, 2]) {
    const path = join(directory, `transcript-v${version}.json`);
    if (!existsSync(path)) continue;
    const contents = readFileSync(path, 'utf8');
    const sha256 = createHash('sha256').update(contents).digest('hex');
    try {
      return {
        version,
        sha256,
        ...auditSegments(JSON.parse(contents), duration),
      };
    } catch {
      return { version, sha256, rows: 0, issues: [{ reason: 'malformed' }] };
    }
  }
  return null;
}

export function writeVerifiedTranscript(directory, segments, duration) {
  const audit = auditSegments(segments, duration);
  if (audit.issues.length)
    throw new Error(
      `New transcript failed validation: ${JSON.stringify(audit.issues.slice(0, 3))}`,
    );
  mkdirSync(directory, { recursive: true });
  const target = join(directory, 'transcript-v3.json');
  const suffix = randomUUID();
  if (existsSync(target)) copyFileSync(target, `${target}.backup-${suffix}`);
  const temporary = `${target}.repair-${suffix}.tmp`;
  writeFileSync(temporary, JSON.stringify(segments), {
    encoding: 'utf8',
    flag: 'wx',
  });
  renameSync(temporary, target);
  return audit;
}

export function repairWordTimingWindows(segments) {
  return segments.map((segment) => ({
    ...segment,
    ...(segment.words?.length
      ? {
          words: segment.words.map((word, index) => {
            const start = Math.max(segment.start, word.start);
            let end = Math.min(segment.end, word.end);
            if (end <= start)
              end = Math.min(
                segment.end,
                segment.words[index + 1]?.start ?? segment.end,
              );
            return { ...word, start, end };
          }),
        }
      : {}),
  }));
}

export function parseOptions(args) {
  const options = {
    apply: false,
    includeMissing: false,
    workers: 1,
    limit: Infinity,
  };
  for (const arg of args) {
    if (arg === '--apply') options.apply = true;
    else if (arg === '--include-missing') options.includeMissing = true;
    else if (/^--workers=[1-3]$/.test(arg))
      options.workers = Number(arg.split('=')[1]);
    else if (/^--limit=[1-9]\d*$/.test(arg))
      options.limit = Number(arg.split('=')[1]);
    else
      throw new Error(
        'Usage: node scripts/audit-podcast-subtitles.mjs [--apply] [--include-missing] [--workers=1..3] [--limit=N]',
      );
  }
  return options;
}

export function selectQueue(rows, options) {
  return rows
    .filter(
      (row) =>
        row.state === 'REPAIR' ||
        (options.includeMissing && row.state === 'MISSING'),
    )
    .sort((a, b) => a.duration - b.duration)
    .slice(0, options.limit);
}

export function isProviderCreditExhausted(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /no credits remaining|insufficient_quota|exceeded your current quota/i.test(
    message,
  );
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  process.chdir(root);
  require('dotenv').config({ quiet: true });
  const { ConfigService } = require('@nestjs/config');
  const { PrismaService } = require('../dist/src/prisma/prisma.service');
  const {
    VideoTranslateService,
  } = require('../dist/src/video-translate/video-translate.service');
  const config = new ConfigService(process.env);
  const prisma = new PrismaService(config);
  let videos;
  try {
    videos = await prisma.podcastVideo.findMany({
      include: { channel: true },
      orderBy: { id: 'asc' },
    });
  } finally {
    await prisma.$disconnect();
  }
  const directoryFor = (video) =>
    join(root, 'storage', 'featured-videos', video.id);
  const inspect = () =>
    videos.map((video) => {
      const cache = readCachedTranscript(directoryFor(video), video.duration);
      return {
        id: video.id,
        title: video.title,
        channel: video.channel.name,
        duration: video.duration,
        visible: video.isVisible && video.channel.isVisible,
        state: !cache ? 'MISSING' : cache.issues.length ? 'REPAIR' : 'OK',
        ...(cache || {}),
      };
    });
  const before = inspect();
  const report = {
    startedAt: new Date().toISOString(),
    applied: options.apply,
    includeMissing: options.includeMissing,
    workers: options.workers,
    channels: new Set(videos.map((video) => video.channelId)).size,
    totalVideos: videos.length,
    before,
    repaired: [],
    failed: [],
  };
  const reportFile = join(
    root,
    'output',
    `podcast-subtitles-${report.startedAt.replace(/[:.]/g, '-')}.json`,
  );
  mkdirSync(dirname(reportFile), { recursive: true });
  const save = () => {
    const temporary = `${reportFile}.${randomUUID()}.tmp`;
    writeFileSync(temporary, JSON.stringify(report, null, 2));
    renameSync(temporary, reportFile);
  };
  save();
  console.log(
    JSON.stringify({
      event: 'AUDIT',
      reportFile,
      total: videos.length,
      missing: before.filter((row) => row.state === 'MISSING').length,
      repair: before
        .filter((row) => row.state === 'REPAIR')
        .map((row) => row.id),
    }),
  );
  if (report.applied) {
    const queue = selectQueue(before, options);
    let next = 0;
    let providerBlocked = false;
    const runVideo = async (video) => {
      const start = Date.now();
      console.log(
        JSON.stringify({ event: 'START', id: video.id, title: video.title }),
      );
      const progress = setInterval(
        () =>
          console.log(
            JSON.stringify({
              event: 'WORKING',
              id: video.id,
              elapsedSeconds: Math.round((Date.now() - start) / 1000),
            }),
          ),
        30000,
      );
      try {
        mkdirSync(directoryFor(video), { recursive: true });
        const onlyWordTiming =
          video.state === 'REPAIR' &&
          video.issues.every((issue) =>
            issue.reasons?.every((reason) => reason === 'word-timing'),
          );
        const processor = new VideoTranslateService({}, config);
        const segments = onlyWordTiming
          ? repairWordTimingWindows(
              JSON.parse(
                readFileSync(
                  join(
                    directoryFor(video),
                    `transcript-v${video.version}.json`,
                  ),
                  'utf8',
                ),
              ),
            )
          : await processor.prepareFeaturedTranscript(
              video.id,
              video.duration,
              directoryFor(video),
              (completedBatches, totalBatches) => {
                console.log(
                  JSON.stringify({
                    event: 'TRANSLATING',
                    id: video.id,
                    completedBatches,
                    totalBatches,
                  }),
                );
              },
            );
        const result = writeVerifiedTranscript(
          directoryFor(video),
          repairWordTimingWindows(segments),
          video.duration,
        );
        report.repaired.push({
          id: video.id,
          beforeRows: video.rows ?? 0,
          method: onlyWordTiming
            ? 'word-timing-only'
            : video.state === 'MISSING'
              ? 'created'
              : 'regenerated',
          ...result,
        });
        console.log(
          JSON.stringify({
            event: 'DONE',
            id: video.id,
            rows: result.rows,
            maxWords: result.maxWords,
          }),
        );
      } catch (error) {
        if (isProviderCreditExhausted(error)) {
          providerBlocked = true;
          report.stopReason =
            'OpenAI API credits exhausted. Add credits before resuming.';
        }
        // Keep every old cache intact when generation or validation fails.
        report.failed.push({
          id: video.id,
          message: error instanceof Error ? error.message : String(error),
        });
        console.log(JSON.stringify({ event: 'FAILED', id: video.id }));
      } finally {
        clearInterval(progress);
        save();
      }
    };
    await Promise.all(
      Array.from(
        { length: Math.min(options.workers, queue.length) },
        async () => {
          while (next < queue.length && !providerBlocked)
            await runVideo(queue[next++]);
        },
      ),
    );
  }
  report.after = inspect();
  report.finishedAt = new Date().toISOString();
  report.summary = {
    total: videos.length,
    cached: report.after.filter((row) => row.state !== 'MISSING').length,
    valid: report.after.filter((row) => row.state === 'OK').length,
    missing: report.after.filter((row) => row.state === 'MISSING').length,
    remainingIssues: report.after.filter((row) => row.state === 'REPAIR')
      .length,
    repaired: report.repaired.length,
    generated: report.repaired.filter((row) => row.method === 'created').length,
    failed: report.failed.length,
  };
  save();
  console.log(
    JSON.stringify({ event: 'FINISHED', reportFile, ...report.summary }),
  );
  if (report.failed.length) process.exitCode = 1;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
