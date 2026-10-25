import type { VideoTranslateSegment } from '../../lib/api';

export function vocabularyToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[^a-z'-]+|[^a-z'-]+$/g, '');
}

export function transcriptWords(segment: VideoTranslateSegment) {
  const tokens = segment.en.split(/\s+/).filter(Boolean);
  if (
    segment.words?.length === tokens.length &&
    segment.words.every(
      (word, index) =>
        Number.isFinite(word.start) &&
        Number.isFinite(word.end) &&
        word.end >= word.start &&
        vocabularyToken(word.text) === vocabularyToken(tokens[index]),
    )
  ) {
    return segment.words.map((word, index) => ({
      ...word,
      text: tokens[index],
    }));
  }
  const weights = tokens.map((word) =>
    Math.max(1, word.replace(/[^a-z0-9]/gi, '').length),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let cursor = segment.start;
  return tokens.map((text, index) => {
    const start = cursor;
    cursor =
      index === tokens.length - 1
        ? segment.end
        : cursor + ((segment.end - segment.start) * weights[index]) / total;
    return { text, start, end: cursor };
  });
}

export function activeTranscriptWord(
  words: ReturnType<typeof transcriptWords>,
  time: number,
) {
  return words.findLastIndex(
    (word) => time + 0.04 >= word.start && time <= word.end + 0.04,
  );
}
