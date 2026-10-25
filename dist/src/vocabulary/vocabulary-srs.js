"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OVERVIEW_DUE_PREVIEW = exports.REVIEW_SESSION_LIMIT = exports.LEARN_SESSION_LIMIT = exports.LAPSE_DELAY_MS = exports.LEARN_WRONG_DELAY_MS = exports.LEARN_CORRECT_DELAY_MS = exports.MAX_INTERVAL_DAYS = exports.MIN_EASE_FACTOR = exports.DEFAULT_EASE_FACTOR = void 0;
exports.addDays = addDays;
exports.addMs = addMs;
exports.clampSessionLimit = clampSessionLimit;
exports.scheduleLearn = scheduleLearn;
exports.scheduleReview = scheduleReview;
exports.DEFAULT_EASE_FACTOR = 2.5;
exports.MIN_EASE_FACTOR = 1.3;
exports.MAX_INTERVAL_DAYS = 60;
exports.LEARN_CORRECT_DELAY_MS = 30 * 60 * 1000;
exports.LEARN_WRONG_DELAY_MS = 10 * 60 * 1000;
exports.LAPSE_DELAY_MS = 10 * 60 * 1000;
exports.LEARN_SESSION_LIMIT = 5;
exports.REVIEW_SESSION_LIMIT = 20;
exports.OVERVIEW_DUE_PREVIEW = 8;
function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}
function addMs(date, ms) {
    return new Date(date.getTime() + ms);
}
function clampSessionLimit(value, fallback) {
    if (!Number.isFinite(value))
        return fallback;
    return Math.min(50, Math.max(1, Math.floor(value)));
}
function scheduleLearn(now, correct) {
    return {
        reviewCount: 0,
        correctCount: 0,
        streak: 0,
        lapses: 0,
        intervalDays: 0,
        easeFactor: exports.DEFAULT_EASE_FACTOR,
        status: 'LEARNING',
        lastReviewedAt: null,
        nextReviewAt: addMs(now, correct ? exports.LEARN_CORRECT_DELAY_MS : exports.LEARN_WRONG_DELAY_MS),
    };
}
function scheduleReview(progress, correct, now) {
    const reviewCount = progress.reviewCount + 1;
    if (!correct) {
        return {
            reviewCount,
            correctCount: progress.correctCount,
            streak: 0,
            lapses: progress.lapses + 1,
            intervalDays: 0,
            easeFactor: Math.max(exports.MIN_EASE_FACTOR, progress.easeFactor - 0.2),
            status: 'LEARNING',
            lastReviewedAt: now,
            nextReviewAt: addMs(now, exports.LAPSE_DELAY_MS),
        };
    }
    const streak = progress.streak + 1;
    const intervalDays = nextIntervalDays(progress, streak);
    const status = (streak >= 4 && intervalDays >= 14) ||
        (progress.status === 'MASTERED' && intervalDays >= 14)
        ? 'MASTERED'
        : 'LEARNING';
    return {
        reviewCount,
        correctCount: progress.correctCount + 1,
        streak,
        lapses: progress.lapses,
        intervalDays,
        easeFactor: progress.easeFactor,
        status,
        lastReviewedAt: now,
        nextReviewAt: addDays(now, intervalDays),
    };
}
function nextIntervalDays(progress, streak) {
    if (progress.streak === 0 && progress.reviewCount > 0) {
        return advanceInterval(progress.intervalDays, progress.easeFactor);
    }
    if (streak <= 1)
        return 1;
    if (streak === 2)
        return 3;
    return advanceInterval(progress.intervalDays, progress.easeFactor);
}
function advanceInterval(previousDays, easeFactor) {
    if (previousDays <= 0)
        return 1;
    if (previousDays === 1)
        return 3;
    return Math.min(exports.MAX_INTERVAL_DAYS, Math.max(4, Math.round(previousDays * easeFactor)));
}
//# sourceMappingURL=vocabulary-srs.js.map