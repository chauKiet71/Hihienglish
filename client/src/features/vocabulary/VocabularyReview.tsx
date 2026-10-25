import { useId, useRef, useState } from 'react';
import { Check, CheckCircle2, RotateCw, X } from 'lucide-react';
import { api, type SavedVocabularyWord } from '../../lib/api';
import { vocabularyChanged } from '../../lib/savedVocabulary';
import { ContextSentence, SpeakButton, StatusBadge } from './WordContent';

export default function VocabularyReview({
  words,
  onClose,
}: {
  words: SavedVocabularyWord[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remembered, setRemembered] = useState(0);
  const pending = useRef<{
    correct: boolean;
    requestId: string;
    expectedReviewCount: number;
  } | null>(null);
  const saving = useRef(false);
  const answerId = useId();
  const word = words[index];
  async function assess(correct: boolean) {
    if (!word || !revealed || saving.current) return;
    saving.current = true;
    setBusy(true);
    setError('');
    pending.current ??= {
      correct,
      requestId: crypto.randomUUID(),
      expectedReviewCount: word.reviewCount,
    };
    try {
      await api.reviewSavedVocabulary(word.id, pending.current);
      if (pending.current.correct) setRemembered((count) => count + 1);
      pending.current = null;
      vocabularyChanged();
      setIndex((value) => value + 1);
      setRevealed(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Chưa lưu được kết quả ôn.',
      );
    } finally {
      setBusy(false);
      saving.current = false;
    }
  }
  if (!word)
    return (
      <main className="vw-review vw-complete">
        <CheckCircle2 size={58} />
        <h1>Đã hoàn thành lượt ôn</h1>
        <p>Bạn đã ôn {words.length} từ.</p>
        <div className="vw-summary">
          <span>
            <strong>{remembered}</strong>Đã nhớ
          </span>
          <span>
            <strong>{words.length - remembered}</strong>Cần ôn thêm
          </span>
        </div>
        <p className="vw-muted">Các từ chưa nhớ sẽ được nhắc ôn sớm hơn.</p>
        <button type="button" className="vw-primary" onClick={onClose}>
          Về sổ từ vựng
        </button>
      </main>
    );
  return (
    <main className="vw-review">
      <header className="vw-review-header">
        <button
          type="button"
          className="vw-icon-button"
          disabled={busy}
          onClick={onClose}
          aria-label="Kết thúc lượt ôn"
        >
          <X size={26} />
        </button>
        <h1>Ôn lại từ vựng</h1>
        <span>
          {index + 1} / {words.length}
        </span>
      </header>
      <progress value={index} max={words.length} aria-label="Số từ đã ôn" />
      <div className="vw-flashcard-scene" key={word.id}>
        <button
          type="button"
          className="vw-card-flip-control"
          aria-label={`Lật thẻ ${word.word} ${revealed ? 'về mặt trước' : 'để xem nghĩa và ví dụ'}`}
          aria-pressed={revealed}
          aria-controls={answerId}
          disabled={busy || !!pending.current}
          onClick={() => setRevealed((value) => !value)}
        />
        <div
          className={`vw-flashcard-flipper${revealed ? ' vw-is-flipped' : ''}`}
        >
          {[false, true].map((back) => (
            <article
              key={String(back)}
              className={`vw-flashcard vw-flashcard-face ${back ? 'vw-flashcard--answer' : 'vw-flashcard--question'}`}
              aria-hidden={back !== revealed}
              inert={back !== revealed}
              id={back ? answerId : undefined}
              onClick={
                back
                  ? (event) => {
                      if (
                        (event.target as Element).closest('button') ||
                        busy ||
                        pending.current
                      )
                        return;
                      setRevealed(false);
                    }
                  : undefined
              }
            >
              {!back && (
                <>
                  <div className="vw-section-heading">
                    <span className="vw-eyebrow">
                      {word.status === 'MASTERED' ? 'Từ đã nhớ' : 'Từ đã lưu'}
                    </span>
                    <StatusBadge word={word} />
                  </div>
                  <div className="vw-card-front">
                    <h2 lang="en">{word.word}</h2>
                    {word.phonetic && (
                      <p className="vw-phonetic">{word.phonetic}</p>
                    )}
                    {word.partOfSpeech && (
                      <p className="vw-muted">{word.partOfSpeech}</p>
                    )}
                    <SpeakButton text={word.word} />
                    <p className="vw-small vw-muted">Nghe phát âm</p>
                  </div>
                </>
              )}
              {back && revealed && (
                <>
                  <div className="vw-card-answer">
                    <p className="vw-meaning">{word.meaning}</p>
                    {word.sources[0] && (
                      <div className="vw-card-example">
                        <SpeakButton
                          text={word.sources[0].sentence}
                          label="Nghe câu ví dụ"
                        />
                        <ContextSentence word={word} source={word.sources[0]} />
                      </div>
                    )}
                  </div>
                  <footer className="vw-assess">
                    <p>Bạn còn nhớ nghĩa của từ này không?</p>
                    <div>
                      <button
                        type="button"
                        className="vw-forgot"
                        disabled={busy || !!pending.current}
                        onClick={() => void assess(false)}
                      >
                        <RotateCw size={20} />
                        Chưa nhớ
                      </button>
                      <button
                        type="button"
                        className="vw-primary"
                        disabled={busy || !!pending.current}
                        onClick={() => void assess(true)}
                      >
                        <Check size={20} />
                        Đã nhớ
                      </button>
                    </div>
                    {busy && <p role="status">Đang lưu kết quả…</p>}
                  </footer>
                  {error && (
                    <div className="vw-error" role="alert">
                      <p>{error}</p>
                      {pending.current && (
                        <button
                          type="button"
                          className="vw-secondary"
                          disabled={busy}
                          onClick={() => void assess(pending.current!.correct)}
                        >
                          Thử lưu lại
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
