import { useEffect, useRef, useState } from 'react';
import { api, type VocabularyLookupDetail, type SavedVocabularySourceInput } from '../../../lib/api';
import { lookupInSource, saveLookedUpWord } from '../../../lib/savedVocabulary';
import { speakEnglishText } from '../../../lib/speech';
import type { Segment } from '../model/types';

export default function WordDetail({
  word,
  segment,
  signedIn,
  source,
  onClose,
}: {
  word: string;
  segment: Segment;
  signedIn: boolean;
  source: SavedVocabularySourceInput;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<VocabularyLookupDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const [activeWord, setActiveWord] = useState(word);
  const lookupVersion = useRef(0);
  useEffect(() => {
    const el = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    el?.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    ++lookupVersion.current;
    let cancelled = false;
    setSaving(false);
    setLoading(true);
    setError('');
    setDetail(null);
    api
      .lookupVocabularyWord({
        word: activeWord,
        sentence: segment.english,
        sentenceTranslation: segment.vietnamese,
      })
      .then((value) => {
        if (!cancelled) setDetail(lookupInSource(value, source));
      })
      .catch((reason) => {
        if (!cancelled)
          setError(
            reason instanceof Error ? reason.message : 'Không thể tra từ.',
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      ++lookupVersion.current;
    };
  }, [activeWord, segment, retry]);
  const save = async () => {
    if (!detail || saving) return;
    setSaving(true);
    setError('');
    const version = lookupVersion.current;
    try {
      const saved = await saveLookedUpWord(detail, source);
      if (version !== lookupVersion.current) return;
      setDetail((previous) =>
        previous ? { ...previous, progress: saved, savedWordId: saved.id } : previous,
      );
    } catch (reason) {
      if (version === lookupVersion.current)
        setError(
          reason instanceof Error ? reason.message : 'Không thể lưu từ.',
        );
    } finally {
      if (version === lookupVersion.current) setSaving(false);
    }
  };
  return (
    <dialog
      className="lp-word-dialog"
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="lp-word-title"
      onClick={(event) => {
        if (event.target === dialog.current) onClose();
      }}
    >
      <div className="lp-section-heading">
        <h2 id="lp-word-title">{activeWord}</h2>
        <button type="button" onClick={onClose} aria-label="Đóng tra từ">
          Đóng ×
        </button>
      </div>
      {loading && <p role="status">Đang tra nghĩa theo ngữ cảnh…</p>}
      {error && (
        <div role="alert" className="lp-error">
          {error}
          <button type="button" onClick={() => setRetry((v) => v + 1)}>
            Thử lại
          </button>
        </div>
      )}
      {detail && (
        <>
          <p>
            {detail.phonetic} · {detail.partOfSpeech}
          </p>
          <button
            type="button"
            onClick={() => speakEnglishText(detail.word, 1)}
          >
            Nghe phát âm
          </button>
          <h3>Nghĩa</h3>
          <p>{detail.meaning}</p>
          <p>{detail.definition}</p>
          <h3>Ví dụ</h3>
          <p>{detail.example}</p>
          <p className="lp-muted">{detail.exampleTranslation}</p>
          <button
            type="button"
            onClick={() => speakEnglishText(detail.example, 1)}
          >
            Nghe ví dụ
          </button>
          {!!detail.synonyms.length && (
            <>
              <h3>Từ đồng nghĩa</h3>
              <div className="lp-tiles">
                {detail.synonyms.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setActiveWord(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
          {signedIn ? (
            <button
              type="button"
              className="lp-primary"
              disabled={saving || !!detail.savedWordId}
              onClick={() => void save()}
            >
              {detail.savedWordId
                ? 'Đã lưu vào từ vựng'
                : saving
                  ? 'Đang lưu…'
                  : 'Lưu vào từ vựng'}
            </button>
          ) : (
            <p className="lp-muted">
              Đăng nhập để lưu từ vào bộ từ vựng của bạn.
            </p>
          )}
        </>
      )}
    </dialog>
  );
}
