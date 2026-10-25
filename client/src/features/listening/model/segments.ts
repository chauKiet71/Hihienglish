import type { Segment } from './types';

/** Merge only unfinished clauses; never mutate the lesson catalog or its timings. */
export function buildSegments(
  source: readonly Segment[],
  length: 'short' | 'long',
): Segment[] {
  const valid = source.filter(
    (s) =>
      s.english.trim() &&
      Number.isFinite(s.time_start) &&
      Number.isFinite(s.time_end) &&
      s.time_start >= 0 &&
      s.time_end > s.time_start,
  );
  if (length === 'short') return valid.map((s) => ({ ...s }));
  const result: Segment[] = [];
  for (const sentence of valid) {
    const previous = result.at(-1);
    if (
      previous &&
      /[,;:]\s*$/.test(previous.english) &&
      sentence.time_start >= previous.time_end - 0.05 &&
      sentence.time_start - previous.time_end <= 2 &&
      sentence.time_end - previous.time_start <= 25
    ) {
      result[result.length - 1] = {
        ...previous,
        id: `${previous.id}+${sentence.id}`,
        english: `${previous.english} ${sentence.english}`,
        vietnamese: [previous.vietnamese, sentence.vietnamese]
          .filter(Boolean)
          .join(' '),
        phonetic: [previous.phonetic, sentence.phonetic]
          .filter(Boolean)
          .join(' '),
        time_end: sentence.time_end,
      };
    } else result.push({ ...sentence });
  }
  return result;
}

export function formatSegmentTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '00:00.0';
  const tenths = Math.round(Math.max(0, seconds) * 10);
  return `${Math.floor(tenths / 600)
    .toString()
    .padStart(2, '0')}:${((tenths % 600) / 10).toFixed(1).padStart(4, '0')}`;
}
