import type { Grade, WordComparison } from './types';

/** Preserve accents and contractions, ignore presentation punctuation and case. */
export function tokenize(text: string): string[] {
  return (
    text
      .normalize('NFC')
      .toLocaleLowerCase()
      .replace(/[’‘]/g, "'")
      .match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) ?? []
  );
}

/** Levenshtein alignment keeps a missed word from shifting the rest of the sentence. */
export function gradeText(expected: string, answer: string): Grade {
  const target = tokenize(expected).slice(0, 400);
  const actual = tokenize(answer).slice(0, 600);
  const table = Array.from(
    { length: target.length + 1 },
    () => new Uint16Array(actual.length + 1),
  );
  for (let i = 0; i <= target.length; i++) table[i][0] = i;
  for (let j = 0; j <= actual.length; j++) table[0][j] = j;
  for (let i = 1; i <= target.length; i++) {
    for (let j = 1; j <= actual.length; j++) {
      table[i][j] = Math.min(
        table[i - 1][j] + 1,
        table[i][j - 1] + 1,
        table[i - 1][j - 1] + (target[i - 1] === actual[j - 1] ? 0 : 1),
      );
    }
  }
  const comparison: WordComparison[] = [];
  let i = target.length;
  let j = actual.length;
  while (i > 0 || j > 0) {
    if (i && j && target[i - 1] === actual[j - 1]) {
      comparison.push({
        expected: target[--i],
        actual: actual[--j],
        status: 'correct',
      });
    } else if (i && j && table[i][j] === table[i - 1][j - 1] + 1) {
      comparison.push({
        expected: target[--i],
        actual: actual[--j],
        status: 'wrong',
      });
    } else if (i && table[i][j] === table[i - 1][j] + 1) {
      comparison.push({ expected: target[--i], status: 'missing' });
    } else {
      comparison.push({ actual: actual[--j], status: 'extra' });
    }
  }
  comparison.reverse();
  const counts = { correct: 0, wrong: 0, missing: 0, extra: 0 };
  for (const word of comparison) counts[word.status]++;
  const score = target.length
    ? Math.round((100 * counts.correct) / (target.length + counts.extra))
    : 0;
  return { score, ...counts, comparison };
}

export function gradeBlanks(
  words: string[],
  indexes: number[],
  answers: string[],
): Grade {
  const comparison: WordComparison[] = indexes.map((index, position) => {
    const expected = words[index];
    const actual = answers[position]?.trim() ?? '';
    return {
      expected,
      actual,
      status: !actual
        ? 'missing'
        : tokenize(expected).join(' ') === tokenize(actual).join(' ')
          ? 'correct'
          : 'wrong',
    };
  });
  const correct = comparison.filter((word) => word.status === 'correct').length;
  return {
    score: indexes.length ? Math.round((correct / indexes.length) * 100) : 0,
    correct,
    wrong: comparison.filter((word) => word.status === 'wrong').length,
    missing: comparison.filter((word) => word.status === 'missing').length,
    extra: 0,
    comparison,
  };
}
