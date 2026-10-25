export type PracticeMode =
  'blank' | 'dictation' | 'meaning' | 'reading' | 'aloud' | 'mixed';
export type ExerciseMode = Exclude<PracticeMode, 'reading' | 'mixed'>;
export interface Segment {
  id: string;
  english: string;
  vietnamese: string;
  phonetic: string;
  time_start: number;
  time_end: number;
}
export interface ListeningSettings {
  difficulty: 25 | 50 | 75;
  segmentLength: 'short' | 'long';
  autoCheck: boolean;
  showWords: boolean;
  autoNext: boolean;
  autoReplay: boolean;
  translation: boolean;
  ipa: boolean;
  shortcuts: boolean;
  soundEffects: boolean;
  readingStyle: 'classic' | 'modern';
  fontSize: number;
  mixedModes: ExerciseMode[];
}
export const EXERCISE_MODES: ExerciseMode[] = [
  'blank',
  'dictation',
  'meaning',
  'aloud',
];
export const MODE_LABELS: Record<PracticeMode, string> = {
  blank: 'Điền từ',
  dictation: 'Chép chính tả',
  meaning: 'Hiểu nghĩa',
  reading: 'Đọc',
  aloud: 'Đọc thành tiếng',
  mixed: 'Hỗn hợp',
};
export const DEFAULT_SETTINGS: ListeningSettings = {
  difficulty: 50,
  segmentLength: 'short',
  autoCheck: false,
  showWords: true,
  autoNext: false,
  autoReplay: true,
  translation: false,
  ipa: false,
  shortcuts: true,
  soundEffects: false,
  readingStyle: 'classic',
  fontSize: 18,
  mixedModes: [...EXERCISE_MODES],
};
export interface WordComparison {
  expected?: string;
  actual?: string;
  status: 'correct' | 'wrong' | 'missing' | 'extra';
}
export interface Grade {
  score: number;
  correct: number;
  wrong: number;
  missing: number;
  extra: number;
  comparison: WordComparison[];
  feedback?: string;
}
export interface Attempt {
  id: string;
  segmentId: string;
  mode: ExerciseMode;
  answer: string;
  grade: Grade;
  hints: number;
  at: number;
}
export interface Progress {
  version: 1;
  segmentId: string;
  mode: PracticeMode;
  step: number;
  attempts: Attempt[];
}
