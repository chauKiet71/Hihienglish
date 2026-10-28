import { readFileSync, writeFileSync } from 'node:fs';
const lessons = JSON.parse(
  readFileSync(
    new URL('../client/src/data/lessons.json', import.meta.url),
    'utf8',
  ),
);
const featured = lessons
  .filter((lesson) => lesson.level === 'BEGINNER')
  .slice(0, 10)
  .map(({ id, title, duration, level, thumbnailUrl, topic }) => ({
    id,
    title,
    duration,
    level,
    thumbnailUrl,
    topic,
  }));
writeFileSync(
  new URL('../client/src/data/homeFeatured.json', import.meta.url),
  JSON.stringify(featured, null, 2) + '\n',
);
