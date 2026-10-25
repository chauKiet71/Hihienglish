import type { ListeningSettings, Segment } from '../model/types';

export default function ReadingPractice({
  segments,
  index,
  settings,
  onChange,
  onSelect,
  onAloud,
  onLookup,
}: {
  segments: Segment[];
  index: number;
  settings: ListeningSettings;
  onChange: (settings: ListeningSettings) => void;
  onSelect: (index: number, slow?: boolean) => void;
  onAloud: (index: number) => void;
  onLookup: (word: string, segment: Segment) => void;
}) {
  return (
    <section
      className={`lp-reading lp-reading-${settings.readingStyle}`}
      aria-label="Đọc theo transcript"
    >
      <div className="lp-actions">
        <button
          type="button"
          aria-label="Giảm cỡ chữ"
          disabled={settings.fontSize <= 14}
          onClick={() =>
            onChange({ ...settings, fontSize: settings.fontSize - 2 })
          }
        >
          A−
        </button>
        <button
          type="button"
          aria-label="Tăng cỡ chữ"
          disabled={settings.fontSize >= 28}
          onClick={() =>
            onChange({ ...settings, fontSize: settings.fontSize + 2 })
          }
        >
          A+
        </button>
        <button
          type="button"
          aria-pressed={settings.readingStyle === 'classic'}
          onClick={() => onChange({ ...settings, readingStyle: 'classic' })}
        >
          Cổ điển
        </button>
        <button
          type="button"
          aria-pressed={settings.readingStyle === 'modern'}
          onClick={() => onChange({ ...settings, readingStyle: 'modern' })}
        >
          Thẻ câu
        </button>
      </div>
      <p className="lp-muted">Bấm một từ để tra nghĩa theo ngữ cảnh.</p>
      {segments.map((segment, i) => (
        <article
          key={segment.id}
          className={index === i ? 'lp-reading-active' : ''}
          aria-label={`Đoạn ${i + 1}`}
        >
          <p
            className="lp-reading-words"
            style={{ fontSize: settings.fontSize }}
          >
            {segment.english.split(/\s+/).map((word, j) => (
              <button
                type="button"
                key={j}
                onClick={() => onLookup(word, segment)}
              >
                {word}
              </button>
            ))}
          </p>
          {settings.ipa && (
            <p className="lp-muted">
              {segment.phonetic || 'Chưa có phiên âm cho câu này.'}
            </p>
          )}
          {settings.translation && (
            <p className="lp-translation">
              {segment.vietnamese || 'Chưa có bản dịch.'}
            </p>
          )}
          <div className="lp-actions">
            <button type="button" onClick={() => onSelect(i)}>
              Nghe câu {i + 1}
            </button>
            <button type="button" onClick={() => onSelect(i, true)}>
              Nghe chậm
            </button>
            <button type="button" onClick={() => onAloud(i)}>
              Đọc thành tiếng
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
