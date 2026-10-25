import { useMemo, useState } from 'react';
import { tokenize } from '../model/grading';
import type { Segment } from '../model/types';

const COMMON = new Set(
  'the this that with from have has had your you they them their there about would could should what when where which will were been being into just than then very some more also because does did are was and for not but can our all how who she his her its get got'.split(
    ' ',
  ),
);
export default function VocabularyPanel({
  segments,
  onLookup,
}: {
  segments: Segment[];
  onLookup: (word: string, segment: Segment) => void;
}) {
  const [query, setQuery] = useState('');
  const entries = useMemo(() => {
    const words = new Map<
      string,
      { word: string; count: number; segment: Segment }
    >();
    for (const segment of segments)
      for (const word of tokenize(segment.english)) {
        if (word.length < 4 || COMMON.has(word) || /^\d+$/.test(word)) continue;
        const entry = words.get(word);
        if (entry) entry.count++;
        else words.set(word, { word, count: 1, segment });
      }
    return [...words.values()].sort(
      (a, b) => b.count - a.count || a.word.localeCompare(b.word),
    );
  }, [segments]);
  return (
    <section className="lp-vocabulary">
      <h2>Từ trong bài · {entries.length}</h2>
      <p className="lp-muted">
        Danh sách trích từ transcript. Chọn từ để xem nghĩa, ví dụ và lưu vào bộ
        từ vựng.
      </p>
      <label className="lp-field">
        Tìm từ
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập từ tiếng Anh…"
        />
      </label>
      <div className="lp-vocabulary-list">
        {entries
          .filter((entry) => entry.word.includes(query.trim().toLowerCase()))
          .map((entry) => (
            <button
              type="button"
              key={entry.word}
              onClick={() => onLookup(entry.word, entry.segment)}
            >
              <strong>{entry.word}</strong>
              <span>{entry.count} lần</span>
            </button>
          ))}
      </div>
      {!entries.length && (
        <p>
          Chưa có từ phù hợp để liệt kê. Bạn vẫn có thể tra từng từ trong chế độ
          Đọc.
        </p>
      )}
    </section>
  );
}
