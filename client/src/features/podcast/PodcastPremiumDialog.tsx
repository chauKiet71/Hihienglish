import { useEffect, useId, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Crown, Headphones, X } from 'lucide-react';

export default function PodcastPremiumDialog({
  previewSeconds,
  backTo,
  onClose,
  onReplay,
}: {
  previewSeconds: number;
  backTo: string;
  onClose: () => void;
  onReplay: () => void;
}) {
  const location = useLocation();
  const titleId = useId();
  const descriptionId = useId();
  const primaryRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    primaryRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-5 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative my-auto w-full max-w-sm rounded-3xl border border-white/20 bg-white p-7 text-center shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          }
          if (event.key === 'Tab') {
            const items = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled])',
              ),
            );
            const first = items[0];
            const last = items.at(-1);
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <button
          type="button"
          aria-label="Đóng thông báo Premium"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
        >
          <X size={19} />
        </button>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-primary dark:bg-violet-500/15">
          <Crown size={32} />
        </div>
        <h2
          id={titleId}
          className="text-2xl font-bold text-slate-900 dark:text-white"
        >
          Nâng cấp Premium
        </h2>
        <p
          id={descriptionId}
          className="mt-3 text-sm leading-6 text-slate-500 dark:text-neutral-400"
        >
          {previewSeconds > 0
            ? 'Nâng cấp Premium để nghe tiếp toàn bộ podcast.'
            : 'Podcast này dành cho thành viên Premium. Nâng cấp để bắt đầu nghe và học trọn bài.'}
        </p>
        <Link
          ref={primaryRef}
          to="/nang-cap"
          state={{ from: location.pathname + location.search }}
          className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20"
        >
          <Crown size={18} />
          Nâng cấp Premium
        </Link>
        {previewSeconds > 0 ? (
          <button
            type="button"
            onClick={onReplay}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Headphones size={17} />
            Nghe lại
          </button>
        ) : (
          <Link
            to={backTo}
            className="mt-3 block py-3 text-sm font-semibold text-slate-500 dark:text-neutral-300"
          >
            Trở về danh sách podcast
          </Link>
        )}
      </section>
    </div>
  );
}
