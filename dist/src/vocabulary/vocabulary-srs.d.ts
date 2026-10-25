export type SrsStatus = 'LEARNING' | 'MASTERED';
export type SrsState = {
    reviewCount: number;
    correctCount: number;
    streak: number;
    lapses: number;
    intervalDays: number;
    easeFactor: number;
    status: SrsStatus;
};
export type SrsSchedule = SrsState & {
    nextReviewAt: Date;
    lastReviewedAt: Date | null;
};
export declare const DEFAULT_EASE_FACTOR = 2.5;
export declare const MIN_EASE_FACTOR = 1.3;
export declare const MAX_INTERVAL_DAYS = 60;
export declare const LEARN_CORRECT_DELAY_MS: number;
export declare const LEARN_WRONG_DELAY_MS: number;
export declare const LAPSE_DELAY_MS: number;
export declare const LEARN_SESSION_LIMIT = 5;
export declare const REVIEW_SESSION_LIMIT = 20;
export declare const OVERVIEW_DUE_PREVIEW = 8;
export declare function addDays(date: Date, days: number): Date;
export declare function addMs(date: Date, ms: number): Date;
export declare function clampSessionLimit(value: number | undefined, fallback: number): number;
export declare function scheduleLearn(now: Date, correct: boolean): SrsSchedule;
export declare function scheduleReview(progress: SrsState, correct: boolean, now: Date): SrsSchedule;
