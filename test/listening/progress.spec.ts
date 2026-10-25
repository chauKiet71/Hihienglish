import {
  nextMixedStep,
  progressFromJson,
  settingsFromJson,
  storageKey,
  summarizeProgress,
} from '../../client/src/features/listening/model/progress';
import { gradeText } from '../../client/src/features/listening/model/grading';
import type {
  Attempt,
  Segment,
} from '../../client/src/features/listening/model/types';
const segments: Segment[] = [
  {
    id: 'a',
    english: 'hello friend',
    vietnamese: '',
    phonetic: '',
    time_start: 0,
    time_end: 2,
  },
];
const attempt: Attempt = {
  id: '1',
  segmentId: 'a',
  mode: 'dictation',
  answer: 'hello',
  hints: 0,
  at: 1,
  grade: gradeText('hello friend', 'hello'),
};
describe('isolated local progress', () => {
  it('resumes a mixed step and rejects out-of-range or invalid values', () => {
    expect(
      progressFromJson('{"version":1,"mode":"mixed","step":2}', segments).step,
    ).toBe(2);
    for (const step of [-1, 4, 1.5, '2']) {
      expect(
        progressFromJson(JSON.stringify({ version: 1, step }), segments).step,
      ).toBe(0);
    }
  });
  it('falls back on invalid JSON', () =>
    expect(progressFromJson('{', segments).attempts).toEqual([]));
  it('rejects stale versions', () =>
    expect(
      progressFromJson(
        JSON.stringify({ version: 0, attempts: [attempt] }),
        segments,
      ).attempts,
    ).toEqual([]));
  it('removes malformed and foreign lesson attempts', () => {
    const data = {
      version: 1,
      attempts: [
        null,
        attempt,
        { ...attempt, segmentId: 'foreign' },
        { ...attempt, grade: { score: 100 } },
      ],
    };
    expect(progressFromJson(JSON.stringify(data), segments).attempts).toEqual([
      attempt,
    ]);
  });
  it('resumes valid mode and sentence', () =>
    expect(
      progressFromJson(
        JSON.stringify({ version: 1, segmentId: 'a', mode: 'meaning' }),
        segments,
      ),
    ).toMatchObject({ segmentId: 'a', mode: 'meaning' }));
  it('counts an attempt separately from mastery', () =>
    expect(summarizeProgress(segments, ['dictation'], [attempt])).toMatchObject(
      { attempted: 1, mastered: 0, percent: 100, average: 50 },
    ));
  it('uses the latest retry rather than inflating completed count', () => {
    const retry = {
      ...attempt,
      id: '2',
      grade: gradeText('hello friend', 'hello friend'),
    };
    expect(
      summarizeProgress(segments, ['dictation'], [attempt, retry]),
    ).toMatchObject({ attempted: 1, mastered: 1, average: 100 });
  });
  it('requires each enabled mixed mode', () =>
    expect(
      summarizeProgress(segments, ['blank', 'dictation'], [attempt]),
    ).toMatchObject({ total: 2, percent: 50 }));
  it('isolates accounts, lessons and segmentation modes', () => {
    expect(
      new Set([
        storageKey('u1', 'l1', 'short'),
        storageKey('u2', 'l1', 'short'),
        storageKey('u1', 'l2', 'short'),
        storageKey('u1', 'l1', 'long'),
      ]).size,
    ).toBe(4);
  });
});
describe('settings and mixed flow', () => {
  it('keeps one mode when stored mixed selection is empty', () =>
    expect(
      settingsFromJson('{"version":1,"mixedModes":[]}').mixedModes.length,
    ).toBeGreaterThan(0));
  it('bounds text size and rejects invalid difficulty', () =>
    expect(
      settingsFromJson('{"version":1,"difficulty":999,"fontSize":999}'),
    ).toMatchObject({ difficulty: 50, fontSize: 28 }));
  it('advances mode before sentence', () =>
    expect(nextMixedStep(0, 0, ['blank', 'meaning'], 2)).toEqual({
      step: 1,
      index: 0,
      finished: false,
    }));
  it('resets mode at next sentence', () =>
    expect(nextMixedStep(1, 0, ['blank', 'meaning'], 2)).toEqual({
      step: 0,
      index: 1,
      finished: false,
    }));
  it('terminates at the last enabled mode of the last sentence', () =>
    expect(nextMixedStep(1, 1, ['blank', 'meaning'], 2).finished).toBe(true));
});
