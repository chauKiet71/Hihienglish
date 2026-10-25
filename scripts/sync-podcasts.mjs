import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const channels = [
  ['bbc', 'bbclearningenglish', 'Tiếng Anh qua tin tức và cuộc sống'],
  ['voa', 'voalearningenglish', 'Luyện nghe tiếng Anh giọng Mỹ'],
  [
    'easy',
    'EasyEnglishVideos',
    'Tiếng Anh trong những cuộc trò chuyện đời thường',
  ],
  [
    'luke',
    'LukesEnglishPodcast',
    'Học tiếng Anh qua những câu chuyện cùng Luke',
  ],
  ['british', 'TheBritishEnglishPodcast', 'Khám phá ngôn ngữ và văn hóa Anh'],
  [
    'diary',
    'TheDiaryOfACEO',
    'Những cuộc trò chuyện về cuộc sống và sự nghiệp',
  ],
  ['ted', 'TED', 'Ý tưởng mới từ những bài nói truyền cảm hứng'],
];
const binary = resolve(
  root,
  'tools',
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
);
const executable = existsSync(binary) ? binary : 'yt-dlp';
const inputDirectory = process.argv[2];

// Pass a directory of podcast-<id>.json files to normalize an existing extraction.
// Without an argument, fetch metadata only; no video/audio is downloaded.
const catalog = [];
for (const [id, handle, description] of channels) {
  const url = `https://www.youtube.com/@${handle}`;
  const raw = inputDirectory
    ? await readFile(
        resolve(root, inputDirectory, `podcast-${id}.json`),
        'utf8',
      )
    : (
        await run(
          executable,
          [
            '--flat-playlist',
            '--playlist-end',
            '30',
            '--dump-single-json',
            '--skip-download',
            '--socket-timeout',
            '20',
            `${url}/videos`,
          ],
          { maxBuffer: 8 * 1024 * 1024, timeout: 120_000 },
        )
      ).stdout;
  const source = JSON.parse(raw.replace(/^\uFEFF/, ''));
  const seen = new Set();
  const videos = (source.entries ?? [])
    .filter((video) => {
      if (
        !/^[a-zA-Z0-9_-]{11}$/.test(video.id) ||
        !video.title ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0 ||
        ['is_live', 'is_upcoming'].includes(video.live_status) ||
        seen.has(video.id)
      )
        return false;
      seen.add(video.id);
      return true;
    })
    .slice(0, 20)
    .map(({ id: videoId, title, duration }) => ({
      id: videoId,
      title,
      duration,
    }));
  if (!source.channel_id || videos.length !== 20) {
    throw new Error(
      `${handle}: expected 20 distinct published videos, got ${videos.length}`,
    );
  }
  const avatar =
    source.thumbnails?.find((thumbnail) => thumbnail.width === 176) ??
    source.thumbnails?.find((thumbnail) => thumbnail.width === 900);
  if (!avatar?.url?.startsWith('https://yt3.googleusercontent.com/')) {
    throw new Error(`${handle}: missing channel avatar`);
  }
  catalog.push({
    id,
    handle,
    name: source.channel,
    channelId: source.channel_id,
    url,
    description,
    avatarUrl: avatar.url,
    videos,
  });
  console.log(`${source.channel}: ${videos.length} videos`);
}

// Only replace the catalog after every channel has been fetched and validated.
await writeFile(
  resolve(root, 'src/catalog/podcast-channels.json'),
  `${JSON.stringify(catalog, null, 2)}\n`,
  'utf8',
);
