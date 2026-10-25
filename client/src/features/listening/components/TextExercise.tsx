import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createBlankExercise, createMeaningTiles } from '../model/exercises';
import { gradeBlanks, gradeText, tokenize } from '../model/grading';
import type {
  ExerciseMode,
  Grade,
  ListeningSettings,
  Segment,
} from '../model/types';
import ExerciseFeedback from './ExerciseFeedback';

export interface TextExerciseProps {
  segment: Segment;
  mode: Exclude<ExerciseMode, 'aloud'>;
  settings: ListeningSettings;
  distractors: string[];
  onGrade: (grade: Grade, answer: string, hints: number) => void;
  onNext: () => void;
  onReplay: (slow?: boolean) => void;
  onPause: () => void;
  suspendAutoNext?: boolean;
}

function TextExercise({
  segment,
  mode,
  settings,
  distractors,
  onGrade,
  onNext,
  onReplay,
  onPause,
  suspendAutoNext = false,
}: TextExerciseProps) {
  const blank = useMemo(
    () =>
      createBlankExercise(
        segment.english,
        settings.difficulty,
        segment.id,
        distractors,
      ),
    [segment, settings.difficulty, distractors],
  );
  const meaningTiles = useMemo(
    () => createMeaningTiles(segment.vietnamese, segment.id),
    [segment],
  );
  const [answers, setAnswers] = useState<string[]>(() =>
    blank.indexes.map(() => ''),
  );
  const [tileIds, setTileIds] = useState<(string | null)[]>(() =>
    blank.indexes.map(() => null),
  );
  const [focused, setFocused] = useState(0);
  const [text, setText] = useState('');
  const [arranged, setArranged] = useState<string[]>([]);
  const [meaningMode, setMeaningMode] = useState<'type' | 'arrange'>('type');
  const [hints, setHints] = useState(0);
  const [revealed, setRevealed] = useState<Record<number, 'letter' | 'word'>>(
    {},
  );
  const [result, setResult] = useState<Grade | null>(null);
  const [retry, setRetry] = useState(0);
  const fields = useRef<(HTMLInputElement | null)[]>([]);
  const completed = useRef(false);
  const words = useMemo(
    () => segment.english.trim().split(/\s+/),
    [segment.english],
  );
  const answer =
    mode === 'meaning' && meaningMode === 'arrange'
      ? arranged
          .map((id) => meaningTiles.find((tile) => tile.id === id)?.text ?? '')
          .join(' ')
      : text;
  const ready =
    mode === 'blank'
      ? answers.length > 0 && answers.every((a) => a.trim())
      : answer.trim().length > 0;
  const unavailable = mode === 'meaning' && !segment.vietnamese.trim();

  const submit = useCallback(() => {
    if (completed.current || !ready || unavailable) return;
    completed.current = true;
    onPause();
    const grade =
      mode === 'blank'
        ? gradeBlanks(blank.words, blank.indexes, answers)
        : gradeText(
            mode === 'meaning' ? segment.vietnamese : segment.english,
            answer,
          );
    setResult(grade);
    onGrade(
      grade,
      mode === 'blank'
        ? blank.words
            .map((word, i) => {
              const position = blank.indexes.indexOf(i);
              return position < 0 ? word : answers[position];
            })
            .join(' ')
        : answer,
      hints,
    );
    if (grade.score < 80 && settings.autoReplay) onReplay();
  }, [
    ready,
    unavailable,
    mode,
    blank,
    answers,
    segment,
    answer,
    hints,
    settings.autoReplay,
    onGrade,
    onReplay,
    onPause,
  ]);

  useEffect(() => {
    if (mode === 'blank' && settings.autoCheck && ready && !result) submit();
  }, [mode, settings.autoCheck, ready, result, submit, retry]);
  useEffect(() => {
    if (!result || result.score < 80 || !settings.autoNext || suspendAutoNext)
      return;
    const timer = window.setTimeout(onNext, 1500);
    return () => window.clearTimeout(timer);
  }, [result, settings.autoNext, onNext, suspendAutoNext]);

  const reveal = (kind: 'letter' | 'word', index?: number) => {
    const target =
      index ??
      words.findIndex((_, i) =>
        kind === 'letter' ? !revealed[i] : revealed[i] !== 'word',
      );
    if (target < 0 || result || revealed[target] === 'word') return;
    setRevealed((previous) => ({ ...previous, [target]: kind }));
    setHints((value) => value + 1);
  };
  const reset = () => {
    completed.current = false;
    setResult(null);
    setText('');
    setArranged([]);
    setAnswers(blank.indexes.map(() => ''));
    setTileIds(blank.indexes.map(() => null));
    setHints(0);
    setRevealed({});
    setRetry((value) => value + 1);
    setFocused(0);
    onReplay();
  };
  const updateAnswer = (
    index: number,
    value: string,
    tileId: string | null = null,
  ) => {
    setAnswers((previous) =>
      previous.map((old, i) => (i === index ? value : old)),
    );
    setTileIds((previous) =>
      previous.map((old, i) => (i === index ? tileId : old)),
    );
  };
  const chooseTile = (id: string, value: string) => {
    let index = focused;
    if (answers[index]?.trim()) {
      const empty = answers.findIndex((a) => !a.trim());
      if (empty >= 0) index = empty;
    }
    updateAnswer(index, value, id);
    const next = answers.findIndex((a, i) => i !== index && !a.trim());
    if (next >= 0) {
      setFocused(next);
      fields.current[next]?.focus();
    }
  };

  return (
    <section
      className="lp-exercise"
      tabIndex={-1}
      aria-label="Bài tập hiện tại"
      onKeyDown={(event) => {
        if (!settings.shortcuts || event.altKey || event.metaKey) return;
        const typing = (event.target as HTMLElement).matches(
          'input,textarea,[contenteditable="true"]',
        );
        if (typing && !event.ctrlKey) return;
        if (event.key.toLowerCase() === 'r') {
          event.preventDefault();
          onReplay(event.shiftKey);
        }
        if (event.key.toLowerCase() === 's') {
          event.preventDefault();
          onNext();
        }
        if (event.key.toLowerCase() === 'h' && mode === 'dictation') {
          event.preventDefault();
          reveal('letter');
        }
      }}
    >
      <p className="lp-eyebrow">
        {mode === 'blank'
          ? 'Nghe và điền từ còn thiếu'
          : mode === 'dictation'
            ? 'Nghe và viết lại toàn bộ câu'
            : 'Diễn đạt ý nghĩa bằng tiếng Việt'}
      </p>
      {unavailable ? (
        <p role="status">
          Câu này chưa có bản dịch. Bạn có thể nghe lại hoặc chuyển sang câu
          khác.
        </p>
      ) : (
        <>
          {mode === 'meaning' && (
            <>
              <h2>{segment.english}</h2>
              <div className="lp-tabs" aria-label="Cách trả lời nghĩa">
                <button
                  type="button"
                  aria-pressed={meaningMode === 'type'}
                  disabled={!!result}
                  onClick={() => {
                    setMeaningMode('type');
                    setText('');
                  }}
                >
                  Tự gõ
                </button>
                <button
                  type="button"
                  aria-pressed={meaningMode === 'arrange'}
                  disabled={!!result}
                  onClick={() => {
                    setMeaningMode('arrange');
                    setArranged([]);
                  }}
                >
                  Sắp xếp từ
                </button>
              </div>
              <p className="lp-muted">
                Chấm theo bản dịch tham khảo, giữ dấu tiếng Việt; cách diễn đạt
                khác có thể có cùng nghĩa.
              </p>
            </>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {mode === 'blank' ? (
              <>
                <div className="lp-blank-sentence">
                  {blank.words.map((word, i) => {
                    const position = blank.indexes.indexOf(i);
                    return position < 0 ? (
                      <span key={i}>{word} </span>
                    ) : (
                      <input
                        key={i}
                        ref={(el) => {
                          fields.current[position] = el;
                        }}
                        aria-label={`Từ còn thiếu ${position + 1}`}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        maxLength={80}
                        size={Math.max(4, Math.min(16, word.length + 1))}
                        disabled={!!result}
                        value={answers[position] ?? ''}
                        onFocus={() => setFocused(position)}
                        onChange={(event) =>
                          updateAnswer(position, event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === 'Enter' &&
                            position < blank.indexes.length - 1 &&
                            !ready
                          ) {
                            event.preventDefault();
                            fields.current[position + 1]?.focus();
                          }
                        }}
                      />
                    );
                  })}
                </div>
                {settings.showWords && (
                  <div className="lp-tiles" aria-label="Từ gợi ý">
                    {blank.tiles.map((tile) => (
                      <button
                        type="button"
                        key={tile.id}
                        disabled={!!result || tileIds.includes(tile.id)}
                        onClick={() => chooseTile(tile.id, tile.text)}
                      >
                        {tile.text}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : mode === 'meaning' && meaningMode === 'arrange' ? (
              <>
                <div className="lp-arranged" aria-label="Bản dịch đã sắp xếp">
                  {arranged.length ? (
                    arranged.map((id) => (
                      <button
                        key={id}
                        type="button"
                        disabled={!!result}
                        aria-label={`Bỏ từ ${meaningTiles.find((t) => t.id === id)?.text}`}
                        onClick={() =>
                          setArranged((previous) =>
                            previous.filter((value) => value !== id),
                          )
                        }
                      >
                        {meaningTiles.find((t) => t.id === id)?.text}
                      </button>
                    ))
                  ) : (
                    <p className="lp-muted">
                      Chọn các từ bên dưới theo thứ tự. Bấm từ đã chọn để bỏ.
                    </p>
                  )}
                </div>
                <div className="lp-tiles">
                  {meaningTiles.map((tile) => (
                    <button
                      type="button"
                      key={tile.id}
                      disabled={!!result || arranged.includes(tile.id)}
                      onClick={() =>
                        setArranged((previous) => [...previous, tile.id])
                      }
                    >
                      {tile.text}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <label className="lp-field">
                {mode === 'dictation'
                  ? 'Câu bạn nghe được'
                  : 'Bản dịch của bạn'}
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  disabled={!!result}
                  rows={4}
                  maxLength={8000}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={
                    mode === 'dictation'
                      ? 'Gõ câu tiếng Anh…'
                      : 'Gõ ý nghĩa bằng tiếng Việt…'
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      submit();
                    }
                  }}
                />
              </label>
            )}
            {mode === 'dictation' && !result && (
              <div className="lp-hints">
                <div className="lp-actions">
                  <button type="button" onClick={() => reveal('letter')}>
                    Chữ cái đầu
                  </button>
                  <button type="button" onClick={() => reveal('word')}>
                    Hé một từ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRevealed(
                        Object.fromEntries(words.map((_, i) => [i, 'word'])),
                      );
                      setHints((value) => value + 1);
                    }}
                  >
                    Hiện toàn bộ
                  </button>
                </div>
                <div className="lp-tiles" aria-label="Gợi ý từng từ">
                  {words.map((word, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Hé từ ${i + 1}`}
                      onClick={() => reveal('word', i)}
                      disabled={revealed[i] === 'word'}
                    >
                      {revealed[i] === 'word'
                        ? word
                        : revealed[i] === 'letter'
                          ? `${word[0]}${'•'.repeat(Math.min(12, word.length - 1))}`
                          : '•'.repeat(
                              Math.min(
                                12,
                                Math.max(1, tokenize(word)[0]?.length ?? 1),
                              ),
                            )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {settings.translation && mode !== 'meaning' && (
              <p className="lp-translation">
                {segment.vietnamese || 'Chưa có bản dịch.'}
              </p>
            )}
            {!result && (
              <button type="submit" className="lp-primary" disabled={!ready}>
                Kiểm tra đáp án <kbd>Enter</kbd>
              </button>
            )}
          </form>
        </>
      )}
      {result && (
        <>
          <ExerciseFeedback
            grade={result}
            expected={mode === 'meaning' ? segment.vietnamese : segment.english}
            hints={hints}
          />
          <div className="lp-actions">
            <button type="button" onClick={reset}>
              Luyện lại câu này
            </button>
            <button type="button" className="lp-primary" onClick={onNext}>
              Tiếp theo
            </button>
          </div>
          {settings.autoNext && result.score >= 80 && (
            <p className="lp-muted">Tự chuyển sau 1,5 giây.</p>
          )}
        </>
      )}
      <div className="lp-actions lp-exercise-actions">
        <button type="button" onClick={() => onReplay()}>
          Nghe lại <kbd>R</kbd>
        </button>
        <button type="button" onClick={() => onReplay(true)}>
          Nghe chậm <kbd>⇧ R</kbd>
        </button>
        {!result && (
          <button type="button" onClick={onNext}>
            Bỏ qua <kbd>S</kbd>
          </button>
        )}
      </div>
      {mode === 'dictation' && (
        <p className="lp-muted">
          Bỏ qua viết hoa, dấu câu và khoảng trắng thừa. Giữ đúng từ, số và dạng
          rút gọn.
        </p>
      )}
    </section>
  );
}
export default memo(TextExercise);
