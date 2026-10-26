import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function PodcastAdminDialog({
  title,
  onClose,
  children,
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !busy) {
            event.preventDefault();
            onClose();
          }
          if (event.key !== 'Tab') return;
          const items = ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), a[href], select:not(:disabled)',
          );
          if (!items?.length) {
            event.preventDefault();
            return;
          }
          const first = items[0];
          const last = items[items.length - 1];
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === ref.current)
          ) {
            event.preventDefault();
            last.focus();
          } else if (
            !event.shiftKey &&
            (document.activeElement === last ||
              document.activeElement === ref.current)
          ) {
            event.preventDefault();
            first.focus();
          }
        }}
        className="relative my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl outline-none"
      >
        <button
          type="button"
          aria-label="Đóng"
          disabled={busy}
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
        >
          <X size={21} />
        </button>
        <h2 id={titleId} className="mb-5 pr-10 text-xl font-bold text-gray-900">
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}
