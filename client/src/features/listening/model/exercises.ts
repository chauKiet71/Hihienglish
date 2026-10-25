import { tokenize } from './grading';

export function seededShuffle<T>(values: readonly T[], seed: string): T[] {
  let state = 2166136261;
  for (const character of seed)
    state = Math.imul(state ^ character.charCodeAt(0), 16777619) >>> 0;
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export interface WordTile {
  id: string;
  text: string;
}
export function createBlankExercise(
  text: string,
  difficulty: 25 | 50 | 75,
  seed: string,
  distractors: readonly string[] = [],
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const candidates = words
    .map((_, index) => index)
    .filter((index) => tokenize(words[index]).length > 0);
  const count = candidates.length
    ? Math.max(1, Math.round((candidates.length * difficulty) / 100))
    : 0;
  const indexes = seededShuffle(candidates, seed)
    .slice(0, count)
    .sort((a, b) => a - b);
  const answerSet = new Set(words.map((word) => tokenize(word).join(' ')));
  const extras = [...new Set(distractors.flatMap(tokenize))].filter(
    (word) => !answerSet.has(word),
  );
  const tiles: WordTile[] = [
    ...indexes.map((index) => ({ id: `answer-${index}`, text: words[index] })),
    ...seededShuffle(extras, seed)
      .slice(0, 2)
      .map((word, i) => ({ id: `extra-${i}`, text: word })),
  ];
  return { words, indexes, tiles: seededShuffle(tiles, `${seed}-tiles`) };
}
export function createMeaningTiles(text: string, seed: string): WordTile[] {
  return seededShuffle(
    text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((text, i) => ({ id: `meaning-${i}`, text })),
    seed,
  );
}
