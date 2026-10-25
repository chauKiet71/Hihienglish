import { memo } from 'react';
import type { VideoTranslateSegment } from '../../lib/api';
import type { ShadowingResult } from '../../lib/shadowing';
import { videoTime } from './catalog';
import { transcriptWords, vocabularyToken } from './transcriptWords';

interface Props {
  segment: VideoTranslateSegment;
  index: number;
  words: ReturnType<typeof transcriptWords>;
  active: boolean;
  activeWord: number;
  playing: boolean;
  disabled: boolean;
  lookupDisabled: boolean;
  translation: boolean;
  result: ShadowingResult | null;
  error: string;
  rowRef: (element: HTMLElement | null, index: number) => void;
  onPlay: (index: number) => void;
  onLookup: (word: string, segment: VideoTranslateSegment) => void;
}

export default memo(function VideoTranscriptRow({
  segment,
  index,
  words,
  active,
  activeWord,
  playing,
  disabled,
  lookupDisabled,
  translation,
  result,
  error,
  rowRef,
  onPlay,
  onLookup,
}: Props) {
  return (
    <article
      ref={(element) => rowRef(element, index)}
      aria-current={active ? 'true' : undefined}
      onClick={() => {
        if (!disabled) onPlay(index);
      }}
      className={`relative w-full cursor-pointer rounded-2xl px-4 py-4 text-left transition-colors ${active ? 'bg-[#efedfc] dark:bg-indigo-950/50' : 'hover:bg-slate-100 dark:hover:bg-neutral-900'}`}
    >
      <div
        className={`flex flex-wrap gap-x-1 gap-y-0.5 text-[13px] font-medium leading-6 ${active ? 'pr-6' : ''}`}
      >
        {words.map((word, wordIndex) => {
          const scored = result?.words[wordIndex];
          const color =
            scored &&
            vocabularyToken(scored.word) === vocabularyToken(word.text)
              ? scored.correct
                ? 'text-emerald-600'
                : 'text-red-500'
              : '';
          return (
            <button
              key={wordIndex}
              type="button"
              disabled={lookupDisabled}
              aria-label={`Xem chi tiết từ ${vocabularyToken(word.text)}`}
              data-active-word={wordIndex === activeWord || undefined}
              onClick={(event) => {
                event.stopPropagation();
                onLookup(word.text, segment);
              }}
              className={`rounded-[5px] border px-0.5 py-px transition-colors focus-visible:outline-2 focus-visible:outline-primary ${wordIndex === activeWord ? 'border-emerald-400 bg-emerald-400/10' : 'border-transparent'} ${color}`}
            >
              {word.text}
            </button>
          );
        })}
      </div>
      {translation && (
        <p className="mt-1 text-[13px] leading-6 text-[#949fb3] dark:text-neutral-400">
          {segment.vi}
        </p>
      )}
      {result && (
        <div className="mt-2 text-xs leading-5">
          <p className="font-semibold text-primary">
            Độ chính xác: {Math.round(result.score)}%
          </p>
          <p className="text-slate-500 dark:text-neutral-400">
            Bạn nói: <span className="italic">{result.transcript || '—'}</span>
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
      <p className="mt-2 text-[10px] tabular-nums text-[#b7bfcd]">
        {videoTime(segment.start)} –{' '}
        {videoTime(
          Math.floor(segment.start) === Math.floor(segment.end)
            ? Math.ceil(segment.end)
            : segment.end,
        )}
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          onPlay(index);
        }}
        aria-label={`Phát câu: ${segment.en}`}
        className={
          active
            ? 'absolute right-2 top-3 flex h-9 w-9 items-center justify-center rounded-full text-primary focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-40'
            : 'sr-only focus-visible:not-sr-only focus-visible:mt-2 focus-visible:rounded-lg focus-visible:bg-primary focus-visible:px-3 focus-visible:py-1 focus-visible:text-xs focus-visible:text-white'
        }
      >
        {active ? (
          <span
            className={`audio-eq ${playing ? 'audio-eq-playing' : ''}`}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>
        ) : (
          'Phát câu'
        )}
      </button>
    </article>
  );
});
