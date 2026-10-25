"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFeaturedCaptions = parseFeaturedCaptions;
function parseFeaturedCaptions(input, durationSec) {
    const events = input?.events;
    if (!Array.isArray(events))
        return [];
    const cues = events
        .flatMap((value) => {
        const event = value;
        if (!event ||
            !Number.isFinite(event.tStartMs) ||
            !Number.isFinite(event.dDurationMs) ||
            !Array.isArray(event.segs))
            return [];
        const en = event.segs
            .map((segment) => typeof segment?.utf8 === 'string' ? segment.utf8 : '')
            .join('')
            .replace(/\s+/g, ' ')
            .trim();
        const start = event.tStartMs / 1000;
        const end = Math.min(durationSec, start + event.dDurationMs / 1000);
        return en && start >= 0 && end > start ? [{ start, end, en }] : [];
    })
        .sort((a, b) => a.start - b.start);
    if (durationSec > 60 && (cues.at(-1)?.end ?? 0) < durationSec / 2)
        return [];
    return cues;
}
//# sourceMappingURL=featured-video-captions.js.map