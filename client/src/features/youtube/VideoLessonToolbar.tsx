import { useEffect, useRef, useState } from 'react';
import { Bookmark, Gauge, Languages, Loader2, Mic, Repeat } from 'lucide-react';

interface Props {
  rate: number;
  translation: boolean;
  saved: boolean;
  looping: boolean;
  ready: boolean;
  speakingAvailable: boolean;
  recording: boolean;
  processing: boolean;
  onRate: (rate: number) => void;
  onTranslation: () => void;
  onSave: () => void;
  onLoop: () => void;
  onSpeak: () => void;
}

export default function VideoLessonToolbar(props: Props) {
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!speedOpen) return;
    const outside = (event: PointerEvent) => {
      if (!speedRef.current?.contains(event.target as Node))
        setSpeedOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSpeedOpen(false);
        speedRef.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [speedOpen]);

  return (
    <footer
      aria-label="Công cụ bài học"
      className="z-50 shrink-0 border-t border-slate-100 bg-white/95 px-3 pb-[max(4px,env(safe-area-inset-bottom))] pt-1 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95"
    >
      <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_minmax(4.75rem,1.15fr)] items-stretch rounded-xl bg-slate-50 p-0.5 shadow-sm dark:bg-neutral-950">
        <div ref={speedRef} className="relative min-w-0">
          <button
            type="button"
            disabled={!props.ready || props.recording || props.processing}
            onClick={() => setSpeedOpen((open) => !open)}
            aria-label="Tùy chỉnh tốc độ phát"
            aria-haspopup="menu"
            aria-expanded={speedOpen}
            className={`flex h-11 w-full flex-col items-center justify-center gap-px disabled:opacity-40 ${speedOpen || props.rate !== 1 ? 'text-primary' : 'text-gray-400'}`}
          >
            <Gauge size={16} />
            <span className="text-[8px] font-semibold tabular-nums leading-none">
              {props.rate === 1 ? '1.0' : props.rate}x
            </span>
            <span className="text-[8px] leading-none">Tốc độ</span>
          </button>
          {speedOpen && (
            <div
              role="menu"
              aria-label="Tốc độ phát"
              className="absolute bottom-full left-0 mb-2 grid w-[min(20rem,calc(100vw-2rem))] grid-cols-5 gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
            >
              {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  role="menuitemradio"
                  aria-checked={rate === props.rate}
                  onClick={() => {
                    props.onRate(rate);
                    setSpeedOpen(false);
                    speedRef.current?.querySelector('button')?.focus();
                  }}
                  className={`h-9 rounded-md text-xs font-semibold ${rate === props.rate ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                >
                  {rate === 1 ? '1.0' : rate}x
                </button>
              ))}
            </div>
          )}
        </div>
        {[
          {
            Icon: Languages,
            label: 'Dịch',
            aria: 'Hiện bản dịch tiếng Việt',
            active: props.translation,
            onClick: props.onTranslation,
          },
          {
            Icon: Bookmark,
            label: props.saved ? 'Đã lưu' : 'Lưu bài',
            aria: props.saved ? 'Bỏ lưu bài học' : 'Lưu bài học',
            active: props.saved,
            onClick: props.onSave,
          },
          {
            Icon: Repeat,
            label: 'Lặp lại',
            aria: 'Lặp lại bài học',
            active: props.looping,
            onClick: props.onLoop,
            disabled: !props.ready || props.recording || props.processing,
          },
        ].map(({ Icon, label, aria, active, onClick, disabled }) => (
          <button
            key={aria}
            type="button"
            aria-label={aria}
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={`flex h-11 min-w-0 flex-col items-center justify-center gap-0.5 px-1 disabled:opacity-40 ${active ? 'text-primary' : 'text-gray-400'}`}
          >
            <Icon
              size={16}
              strokeWidth={active ? 2.5 : 2}
              className={
                Icon === Bookmark && active ? 'fill-current' : undefined
              }
            />
            <span className="text-[8px] leading-tight">{label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={props.onSpeak}
          disabled={!props.speakingAvailable || props.processing}
          aria-label={
            props.processing
              ? 'Đang chấm điểm'
              : props.recording
                ? 'Dừng Shadowing'
                : 'Bắt đầu Shadowing'
          }
          className={`m-0.5 flex h-10 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-white disabled:opacity-50 ${props.recording ? 'bg-red-500 ring-2 ring-red-300' : 'bg-gradient-to-r from-primary to-secondary shadow-md shadow-primary/25'}`}
        >
          {props.processing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Mic size={18} />
              <span className="text-[9px] font-semibold leading-none">
                {props.recording ? 'Dừng' : 'Nói'}
              </span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
}
