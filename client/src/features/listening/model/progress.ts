import {
  DEFAULT_SETTINGS,
  EXERCISE_MODES,
  MODE_LABELS,
  type Attempt,
  type ExerciseMode,
  type ListeningSettings,
  type Progress,
  type Segment,
} from './types';

export function settingsFromJson(raw: string | null): ListeningSettings {
  const defaults = { ...DEFAULT_SETTINGS, mixedModes: [...EXERCISE_MODES] };
  try {
    const data = JSON.parse(raw ?? 'null');
    if (!data || typeof data !== 'object' || data.version !== 1)
      return defaults;
    for (const key of [
      'autoCheck',
      'showWords',
      'autoNext',
      'autoReplay',
      'translation',
      'ipa',
      'shortcuts',
      'soundEffects',
    ] as const) {
      if (typeof data[key] === 'boolean') defaults[key] = data[key];
    }
    if ([25, 50, 75].includes(data.difficulty))
      defaults.difficulty = data.difficulty;
    if (data.segmentLength === 'long') defaults.segmentLength = 'long';
    if (data.readingStyle === 'modern') defaults.readingStyle = 'modern';
    if (Number.isFinite(data.fontSize))
      defaults.fontSize = Math.max(14, Math.min(28, data.fontSize));
    if (Array.isArray(data.mixedModes)) {
      const modes = EXERCISE_MODES.filter((mode) =>
        data.mixedModes.includes(mode),
      );
      if (modes.length) defaults.mixedModes = modes;
    }
    return defaults;
  } catch {
    return defaults;
  }
}
export function progressFromJson(
  raw: string | null,
  segments: readonly Segment[],
): Progress {
  const empty: Progress = {
    version: 1,
    segmentId: segments[0]?.id ?? '',
    mode: 'blank',
    step: 0,
    attempts: [],
  };
  try {
    const data = JSON.parse(raw ?? 'null');
    if (!data || data.version !== 1) return empty;
    const ids = new Set(segments.map((s) => s.id));
    const attempts = Array.isArray(data.attempts)
      ? data.attempts
          .filter(
            (a: Attempt) =>
              a &&
              typeof a.id === 'string' &&
              ids.has(a.segmentId) &&
              EXERCISE_MODES.includes(a.mode) &&
              typeof a.answer === 'string' &&
              a.answer.length <= 8000 &&
              Number.isFinite(a.at) &&
              Number.isInteger(a.hints) &&
              a.hints >= 0 &&
              a.grade &&
              Number.isFinite(a.grade.score) &&
              a.grade.score >= 0 &&
              a.grade.score <= 100 &&
              ['correct', 'wrong', 'missing', 'extra'].every(
                (key) =>
                  Number.isInteger(a.grade[key as 'correct']) &&
                  a.grade[key as 'correct'] >= 0,
              ) &&
              Array.isArray(a.grade.comparison) &&
              a.grade.comparison.length <= 1000 &&
              a.grade.comparison.every(
                (w) =>
                  w &&
                  ['correct', 'wrong', 'missing', 'extra'].includes(w.status) &&
                  (w.expected === undefined ||
                    typeof w.expected === 'string') &&
                  (w.actual === undefined || typeof w.actual === 'string'),
              ) &&
              (a.grade.feedback === undefined ||
                typeof a.grade.feedback === 'string'),
          )
          .slice(-2000)
      : [];
    return {
      version: 1,
      segmentId: ids.has(data.segmentId) ? data.segmentId : empty.segmentId,
      mode: Object.hasOwn(MODE_LABELS, data.mode) ? data.mode : 'blank',
      step:
        Number.isInteger(data.step) &&
        data.step >= 0 &&
        data.step < EXERCISE_MODES.length
          ? data.step
          : 0,
      attempts,
    };
  } catch {
    return empty;
  }
}
export function latestAttempts(
  attempts: readonly Attempt[],
): Map<string, Attempt> {
  const result = new Map<string, Attempt>();
  for (const attempt of attempts)
    result.set(`${attempt.segmentId}:${attempt.mode}`, attempt);
  return result;
}
export function summarizeProgress(
  segments: readonly Segment[],
  modes: readonly ExerciseMode[],
  attempts: readonly Attempt[],
) {
  const latest = latestAttempts(attempts);
  let attempted = 0;
  let mastered = 0;
  let totalScore = 0;
  for (const segment of segments)
    for (const mode of modes) {
      const attempt = latest.get(`${segment.id}:${mode}`);
      if (!attempt) continue;
      attempted++;
      totalScore += attempt.grade.score;
      if (attempt.grade.score >= 80) mastered++;
    }
  const total = segments.length * modes.length;
  return {
    attempted,
    mastered,
    total,
    percent: total ? Math.round((attempted / total) * 100) : 0,
    average: attempted ? Math.round(totalScore / attempted) : 0,
  };
}
export function nextMixedStep(
  step: number,
  index: number,
  modes: readonly ExerciseMode[],
  count: number,
) {
  if (step + 1 < modes.length)
    return { step: step + 1, index, finished: false };
  if (index + 1 < count) return { step: 0, index: index + 1, finished: false };
  return { step, index, finished: true };
}
export function storageKey(
  userId: string | undefined,
  lessonId: string,
  length: 'short' | 'long',
) {
  return `hihi:listening:v1:${encodeURIComponent(userId ?? 'guest')}:${encodeURIComponent(lessonId)}:${length}`;
}
