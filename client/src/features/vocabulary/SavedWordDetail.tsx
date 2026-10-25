import { useEffect, useRef, useState } from 'react';
import { BookmarkMinus, RotateCw, X } from 'lucide-react';
import type { SavedVocabularyWord } from '../../lib/api';
import { ContextSentence, SpeakButton, StatusBadge } from './WordContent';

export default function SavedWordDetail({
  word,
  preferredSource,
  busy,
  error,
  onClose,
  onRemove,
  onReview,
}: {
  word: SavedVocabularyWord;
  preferredSource?: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onRemove: () => void;
  onReview: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [sourceId, setSourceId] = useState(
    () =>
      word.sources.find(
        (s) => `${s.sourceType}:${s.sourceId}` === preferredSource,
      )?.id ?? word.sources[0]?.id,
  );
  const source = word.sources.find((s) => s.id === sourceId) ?? word.sources[0];
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      className="vw-dialog"
      ref={ref}
      aria-labelledby="saved-word-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section className="vw-sheet">
        <div className="vw-handle" />
        <header className="vw-sheet-header">
          <h2>Chi tiết từ</h2>
          <button
            type="button"
            className="vw-icon-button"
            aria-label="Đóng chi tiết từ"
            disabled={busy}
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </header>
        <div className="vw-sheet-content">
          <div className="vw-word-heading">
            <h3 id="saved-word-title" lang="en">
              {word.word}
            </h3>
            <SpeakButton text={word.word} />
          </div>
          {word.phonetic && <p className="vw-phonetic">{word.phonetic}</p>}
          {word.partOfSpeech && <p className="vw-muted">{word.partOfSpeech}</p>}
          <StatusBadge word={word} />
          <section className="vw-detail-section">
            <h3>Nghĩa trong bài</h3>
            <p className="vw-meaning">{word.meaning}</p>
          </section>
          {source && (
            <section className="vw-detail-section">
              <div className="vw-section-heading">
                <h3>Câu trong bài nghe</h3>
                <SpeakButton text={source.sentence} label="Nghe câu gốc" />
              </div>
              <ContextSentence word={word} source={source} />
            </section>
          )}
          {word.sources.length > 1 && (
            <label className="vw-select-label">
              Nguồn đã lưu
              <select
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
              >
                {word.sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} · {Math.floor(s.startTime / 60)}:
                    {String(Math.floor(s.startTime % 60)).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </label>
          )}
          {error && (
            <p className="vw-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <footer className="vw-sheet-actions">
          <button
            type="button"
            className="vw-primary"
            onClick={onReview}
            disabled={busy}
          >
            <RotateCw size={22} />
            Ôn lại từ này
          </button>
          <button
            type="button"
            className="vw-remove"
            disabled={busy}
            onClick={onRemove}
          >
            <BookmarkMinus size={20} />
            {busy ? 'Đang xử lý…' : 'Bỏ lưu từ'}
          </button>
        </footer>
      </section>
    </dialog>
  );
}
