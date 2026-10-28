/** YouTube translation tracks can put the entire script into the first cue. */
export function parseFeaturedCaptions(input: unknown, durationSec: number) {
  const events = (input as { events?: unknown[] } | null)?.events;
  if (!Array.isArray(events)) return [];
  const cues = events
    .flatMap((value) => {
      const event = value as {
        tStartMs?: number;
        dDurationMs?: number;
        segs?: Array<{ utf8?: string }>;
      } | null;
      if (
        !event ||
        !Number.isFinite(event.tStartMs) ||
        !Number.isFinite(event.dDurationMs) ||
        !Array.isArray(event.segs)
      )
        return [];
      const en = event.segs
        .map((segment) =>
          typeof segment?.utf8 === 'string' ? segment.utf8 : '',
        )
        .join('')
        .replace(/\s+/g, ' ')
        .trim();
      const start = event.tStartMs! / 1000;
      const end = Math.min(durationSec, start + event.dDurationMs! / 1000);
      return en && start >= 0 && end > start ? [{ start, end, en }] : [];
    })
    .sort((a, b) => a.start - b.start);
  if (durationSec > 60 && (cues.at(-1)?.end ?? 0) < durationSec / 2) return [];
  return cues;
}

/** Prefer sentence punctuation over an auto-translated English track's locale. */
export function selectFeaturedCaptionTrack(
  tracks: Array<Array<{ start: number; end: number; en: string }>>,
) {
  const score = (cues: Array<{ en: string }>) => {
    const text = cues.map((cue) => cue.en).join(' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    const stops = text.match(/[.!?…]["')\]]?(?=\s|$)/g)?.length ?? 0;
    return stops / Math.max(1, words);
  };
  return (
    tracks
      .filter((track) => track.length)
      .sort((a, b) => score(b) - score(a))[0] ?? []
  );
}
