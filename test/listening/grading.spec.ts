import {
  gradeText,
  gradeBlanks,
  tokenize,
} from '../../client/src/features/listening/model/grading';
import {
  createBlankExercise,
  createMeaningTiles,
} from '../../client/src/features/listening/model/exercises';

describe('dictation grading', () => {
  it('ignores punctuation, case and extra whitespace', () =>
    expect(gradeText('Hello, this is BBC!', ' hello THIS is bbc ').score).toBe(
      100,
    ));
  it('normalizes smart apostrophes', () =>
    expect(gradeText("I'm here.", 'I’m here').score).toBe(100));
  it('does not discard contractions', () =>
    expect(gradeText("I can't swim", 'I can swim').wrong).toBe(1));
  it('aligns around a missing word', () => {
    const result = gradeText(
      'we will meet here tomorrow',
      'we will here tomorrow',
    );
    expect(result).toMatchObject({
      correct: 4,
      missing: 1,
      wrong: 0,
      score: 80,
    });
    expect(result.comparison[2]).toEqual({
      expected: 'meet',
      status: 'missing',
    });
  });
  it('penalizes additional words instead of accepting a superset', () =>
    expect(gradeText('good morning', 'good very morning')).toMatchObject({
      extra: 1,
      score: 67,
    }));
  it('preserves Vietnamese accents', () =>
    expect(gradeText('bạn có khỏe không', 'ban co khoe khong').score).toBe(0));
  it('accepts canonically equivalent Unicode', () =>
    expect(gradeText('tiếng Việt', 'tiếng Việt'.normalize('NFD')).score).toBe(
      100,
    ));
  it('does not award an empty target a perfect score', () =>
    expect(gradeText('', '').score).toBe(0));
  it('marks empty answers missing', () =>
    expect(gradeText('one two', '')).toMatchObject({ missing: 2, score: 0 }));
  it('handles repeated words in order', () =>
    expect(gradeText('very very good', 'very good')).toMatchObject({
      correct: 2,
      missing: 1,
    }));
  it('retains numbers', () =>
    expect(tokenize('6 Minute English')).toEqual(['6', 'minute', 'english']));
  it('grades only the requested blanks', () =>
    expect(
      gradeBlanks(['Hello,', 'my', 'friend.'], [0, 2], ['hello', 'world']),
    ).toMatchObject({ score: 50, correct: 1, wrong: 1 }));
});
describe('repeatable exercise generation', () => {
  const text = 'we can learn to listen a little better';
  it.each([25, 50, 75] as const)(
    'hides the expected ratio at %i%%',
    (difficulty) => {
      expect(createBlankExercise(text, difficulty, 'a').indexes).toHaveLength(
        Math.round((8 * difficulty) / 100),
      );
    },
  );
  it('does not change blanks on rerender', () =>
    expect(createBlankExercise(text, 50, 'a')).toEqual(
      createBlankExercise(text, 50, 'a'),
    ));
  it('preserves duplicate answer tiles with distinct IDs', () => {
    const result = createBlankExercise('very very very very', 75, 'a');
    expect(result.tiles).toHaveLength(3);
    expect(new Set(result.tiles.map((tile) => tile.id)).size).toBe(3);
  });
  it('uses distractors outside the sentence', () => {
    const result = createBlankExercise('hello friend', 50, 'a', [
      'hello world school',
    ]);
    expect(
      result.tiles
        .filter((t) => t.id.startsWith('extra'))
        .map((t) => t.text)
        .sort(),
    ).toEqual(['school', 'world']);
  });
  it('gives each repeated Vietnamese word an identity', () => {
    const tiles = createMeaningTiles('bạn và bạn', 'b');
    expect(tiles).toHaveLength(3);
    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(3);
  });
  it('handles empty content', () =>
    expect(createBlankExercise('', 50, 'a').indexes).toEqual([]));
});
