import { Volume2 } from 'lucide-react';
import type { SavedVocabularySource, SavedVocabularyWord } from '../../lib/api';
import { speakEnglishText } from '../../lib/speech';

export function StatusBadge({ word }: { word: SavedVocabularyWord }) {
  const mastered = word.status === 'MASTERED';
  const due = new Date(word.nextReviewAt).getTime() <= Date.now();
  return (
    <span
      className={`vw-badge ${mastered ? 'vw-mastered' : due ? 'vw-due' : ''}`}
    >
      {mastered
        ? 'Đã nhớ'
        : due
          ? 'Cần ôn'
          : word.reviewCount > 0
            ? 'Đang học'
            : 'Mới lưu'}
    </span>
  );
}
export function SpeakButton({ text, label }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      className="vw-icon-button"
      onClick={() => speakEnglishText(text, 0.85)}
      aria-label={label ?? `Nghe phát âm ${text}`}
    >
      <Volume2 size={22} />
    </button>
  );
}
export function ContextSentence({
  word,
  source,
}: {
  word: SavedVocabularyWord;
  source?: SavedVocabularySource;
}) {
  if (!source) return null;
  const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = source.sentence.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      <p className="vw-sentence" lang="en">
        {parts.map((part, i) =>
          part.toLowerCase() === word.word.toLowerCase() ? (
            <mark key={i}>{part}</mark>
          ) : (
            part
          ),
        )}
      </p>
      <p className="vw-translation">{source.sentenceTranslation}</p>
    </>
  );
}
