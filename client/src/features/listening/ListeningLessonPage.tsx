import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCanAccessLesson } from '../../contexts/LessonAccessContext';
import { getLessonById, type Lesson } from '../../data/lessons';
import { buildSegments, formatSegmentTime } from './model/segments';
import {
  nextMixedStep,
  progressFromJson,
  settingsFromJson,
  storageKey,
  summarizeProgress,
  latestAttempts,
} from './model/progress';
import {
  EXERCISE_MODES,
  MODE_LABELS,
  type Attempt,
  type Grade,
  type ListeningSettings as Settings,
  type PracticeMode,
  type Segment,
} from './model/types';
import { useSegmentPlayer } from './player/useSegmentPlayer';
import TextExercise from './components/TextExercise';
import ReadingPractice from './components/ReadingPractice';
import ReadAloudPractice from './components/ReadAloudPractice';
import ListeningSettings from './components/ListeningSettings';
import ListeningReview from './components/ListeningReview';
import VocabularyPanel from './components/VocabularyPanel';
import WordDetail from './components/WordDetail';
import './listening.css';

function measureHeader(header: HTMLElement | null) {
  if (!header) return;
  const update = () =>
    header.parentElement?.style.setProperty(
      '--lp-header-height',
      `${header.offsetHeight}px`,
    );
  update();
  if (typeof ResizeObserver === 'undefined') return;
  const observer = new ResizeObserver(update);
  observer.observe(header);
  return () => observer.disconnect();
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export default function ListeningLessonPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { canAccess, loading } = useCanAccessLesson(id);
  const lesson = useMemo(() => getLessonById(id), [id]);
  if (!lesson)
    return (
      <main className="lp-page">
        <h1>Không tìm thấy bài học</h1>
        <Link to="/kham-pha">Khám phá bài nghe</Link>
      </main>
    );
  if (loading)
    return (
      <main className="lp-page" role="status">
        Đang kiểm tra quyền truy cập bài học…
      </main>
    );
  if (!canAccess)
    return (
      <main className="lp-page">
        <h1>Bài học Pro</h1>
        <p>Nâng cấp để luyện tập bài học này.</p>
        <Link to="/nang-cap">Nâng cấp Pro</Link> ·{' '}
        <Link to={`/bai-hoc/${id}`}>Quay lại bài học</Link>
      </main>
    );
  return (
    <ListeningPreferences
      key={`${id}:${user?.id ?? 'guest'}`}
      lesson={lesson}
      userId={user?.id}
    />
  );
}

function ListeningPreferences({
  lesson,
  userId,
}: {
  lesson: Lesson;
  userId?: string;
}) {
  const preferenceKey = `hihi:listening:settings:v1:${userId ?? 'guest'}`;
  const [settings, setSettings] = useState<Settings>(() =>
    settingsFromJson(readStorage(preferenceKey)),
  );
  const [storageError, setStorageError] = useState('');
  const changeSettings = useCallback(
    (next: Settings) => {
      setSettings(next);
      try {
        localStorage.setItem(
          preferenceKey,
          JSON.stringify({ ...next, version: 1 }),
        );
        setStorageError('');
      } catch {
        setStorageError(
          'Trình duyệt không lưu được cài đặt. Bạn vẫn có thể luyện tập trong phiên này.',
        );
      }
    },
    [preferenceKey],
  );
  const segments = useMemo(
    () => buildSegments(lesson.sentences, settings.segmentLength),
    [lesson, settings.segmentLength],
  );
  if (!segments.length)
    return (
      <main className="lp-page">
        <h1>Bài học chưa có đoạn nghe hợp lệ</h1>
        <Link to={`/bai-hoc/${lesson.id}`}>Quay lại bài học</Link>
      </main>
    );
  return (
    <ListeningWorkspace
      key={settings.segmentLength}
      lesson={lesson}
      userId={userId}
      segments={segments}
      settings={settings}
      onSettings={changeSettings}
      settingsError={storageError}
    />
  );
}

function ListeningWorkspace({
  lesson,
  userId,
  segments,
  settings,
  onSettings,
  settingsError,
}: {
  lesson: Lesson;
  userId?: string;
  segments: Segment[];
  settings: Settings;
  onSettings: (settings: Settings) => void;
  settingsError: string;
}) {
  const key = storageKey(userId, lesson.id, settings.segmentLength);
  const [saved] = useState(() => progressFromJson(readStorage(key), segments));
  const [mode, setMode] = useState<PracticeMode>(saved.mode);
  const [step, setStep] = useState(saved.step);
  const [attempts, setAttempts] = useState<Attempt[]>(saved.attempts);
  const [review, setReview] = useState(false);
  const [retry, setRetry] = useState(0);
  const [panel, setPanel] = useState<'transcript' | 'vocabulary'>('transcript');
  const [showTranscript, setShowTranscript] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [lookup, setLookup] = useState<{
    word: string;
    segment: Segment;
  } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(36);
  const [dragging, setDragging] = useState(false);
  const [recorderBusy, setRecorderBusy] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(
    () => window.matchMedia('(min-width: 801px)').matches,
  );
  const layout = useRef<HTMLDivElement>(null);
  const sound = useRef<AudioContext | null>(null);
  const player = useSegmentPlayer(
    segments,
    Math.max(
      0,
      segments.findIndex((s) => s.id === saved.segmentId),
    ),
  );
  const { state, select, pause, play, configure } = player;
  const segment = segments[state.index];
  const effectiveStep = Math.min(step, settings.mixedModes.length - 1);
  const exerciseMode =
    mode === 'mixed' ? settings.mixedModes[effectiveStep] : mode;
  const activeModes = useMemo(
    () =>
      mode === 'mixed'
        ? settings.mixedModes
        : mode === 'reading'
          ? EXERCISE_MODES
          : [mode],
    [mode, settings.mixedModes],
  );
  const summary = useMemo(
    () => summarizeProgress(segments, activeModes, attempts),
    [segments, activeModes, attempts],
  );
  const latest = useMemo(() => latestAttempts(attempts), [attempts]);
  const distractors = useMemo(() => segments.map((s) => s.english), [segments]);
  const revealTranscript =
    showTranscript ||
    mode === 'reading' ||
    mode === 'meaning' ||
    mode === 'aloud';
  useEffect(() => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          segmentId: segment.id,
          mode,
          step: effectiveStep,
          attempts,
        }),
      );
      setSaveError('');
    } catch {
      setSaveError(
        'Không lưu được tiến độ trên trình duyệt. Giữ trang mở để tiếp tục phiên học.',
      );
    }
  }, [key, segment.id, mode, effectiveStep, attempts]);
  useEffect(
    () => () => {
      void sound.current?.close();
    },
    [],
  );
  useEffect(() => {
    if (!dragging) return;
    const move = (event: PointerEvent) => {
      const bounds = layout.current?.getBoundingClientRect();
      if (bounds)
        setSidebarWidth(
          Math.max(
            25,
            Math.min(55, ((event.clientX - bounds.left) / bounds.width) * 100),
          ),
        );
    };
    const stop = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
  }, [dragging]);
  const onReplay = useCallback((slow = false) => play(slow, true), [play]);
  const onNext = useCallback(() => {
    pause();
    if (mode === 'mixed') {
      const next = nextMixedStep(
        effectiveStep,
        state.index,
        settings.mixedModes,
        segments.length,
      );
      if (next.finished) {
        setReview(true);
        return;
      }
      setStep(next.step);
      select(next.index);
      setRetry((value) => value + 1);
    } else if (state.index + 1 < segments.length) {
      select(state.index + 1);
      setRetry((value) => value + 1);
    } else setReview(true);
  }, [
    pause,
    mode,
    effectiveStep,
    state.index,
    settings.mixedModes,
    segments.length,
    select,
  ]);
  const onGrade = useCallback(
    (grade: Grade, answer: string, hints: number) => {
      if (exerciseMode === 'reading') return;
      setAttempts((previous) =>
        [
          ...previous,
          {
            id: crypto.randomUUID(),
            segmentId: segment.id,
            mode: exerciseMode,
            answer,
            hints,
            grade,
            at: Date.now(),
          },
        ].slice(-2000),
      );
      if (settings.soundEffects) {
        try {
          const audio = sound.current ?? new AudioContext();
          sound.current = audio;
          void audio.resume();
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          oscillator.frequency.value = grade.score >= 80 ? 660 : 240;
          gain.gain.setValueAtTime(0.07, audio.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.15,
          );
          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.start();
          oscillator.stop(audio.currentTime + 0.16);
        } catch {
          /* Optional feedback sound must never interrupt practice. */
        }
      }
    },
    [exerciseMode, segment.id, settings.soundEffects],
  );
  const changeMode = (next: PracticeMode) => {
    pause();
    configure(state.repeat, false);
    setMode(next);
    setStep(0);
    setReview(false);
    setRetry((value) => value + 1);
    setShowTranscript(false);
  };
  const chooseSentence = (index: number, slow?: boolean) => {
    select(index);
    setStep(0);
    setRetry((value) => value + 1);
    if (mode === 'reading') play(slow, true);
  };
  const openLookup = (word: string, sentence: Segment) => {
    const clean = word
      .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
      .toLowerCase();
    if (!clean) return;
    pause();
    setLookup({ word: clean, segment: sentence });
  };
  const exerciseKey = `${segment.id}:${exerciseMode}:${settings.difficulty}:${settings.mixedModes.join(',')}:${retry}`;

  return (
    <main className="lp-page">
      <audio
        ref={player.audioRef}
        src={lesson.audioUrl}
        preload="metadata"
        data-testid="listening-practice-audio"
      />
      <header className="lp-header" ref={measureHeader}>
        <Link to={`/bai-hoc/${lesson.id}`} state={{ autoPlay: false }}>
          ← Bài nghe
        </Link>
        <div>
          <p className="lp-eyebrow">Không gian luyện tập</p>
          <h1>{lesson.title}</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            pause();
            setReview((value) => !value);
          }}
        >
          Xem kết quả
        </button>
      </header>
      <div className="lp-progress">
        <progress
          max={100}
          value={summary.percent}
          aria-label="Tiến độ bài tập"
        />
        <span>
          Đã làm {summary.attempted}/{summary.total} · Đạt {summary.mastered} ·
          Điểm {summary.average}%
        </span>
      </div>
      <p className="lp-storage">
        Tiến độ luyện tập được lưu riêng trên trình duyệt này
        {userId ? ' theo tài khoản của bạn' : ' cho khách'}. Lịch sử nghe hiện
        tại giữ nguyên.
      </p>
      {(saveError || settingsError) && (
        <p role="alert" className="lp-error">
          {saveError || settingsError}
        </p>
      )}
      <ListeningSettings
        settings={settings}
        onChange={(next) => {
          pause();
          setStep(0);
          onSettings(next);
        }}
      />
      <div
        className="lp-layout"
        ref={layout}
        style={{ gridTemplateColumns: `${sidebarWidth}% 8px minmax(0, 1fr)` }}
      >
        <aside className="lp-sidebar">
          <div className="lp-player">
            <img src={lesson.thumbnailUrl} alt="" />
            <div className="lp-player-title">
              Câu {state.index + 1} / {segments.length}
            </div>
            <p>
              {formatSegmentTime(segment.time_start)} –{' '}
              {formatSegmentTime(segment.time_end)}
            </p>
            <div className="lp-player-buttons">
              <button
                type="button"
                aria-label="Câu trước"
                disabled={state.index === 0}
                onClick={() => chooseSentence(state.index - 1)}
              >
                ←
              </button>
              <button
                type="button"
                className="lp-play"
                disabled={recorderBusy}
                onClick={() => (state.playing ? pause() : play())}
                aria-label={
                  state.playing ? 'Tạm dừng đoạn nghe' : 'Phát đoạn nghe'
                }
              >
                {state.playing ? 'Ⅱ' : '▶'}
              </button>
              <button
                type="button"
                aria-label="Câu sau"
                disabled={state.index === segments.length - 1}
                onClick={() => chooseSentence(state.index + 1)}
              >
                →
              </button>
            </div>
            <progress
              max={Math.max(0.1, segment.time_end - segment.time_start)}
              value={Math.max(
                0,
                Math.min(segment.time_end, state.time) - segment.time_start,
              )}
              aria-label="Vị trí trong đoạn"
            />
          </div>
          <div className="lp-player-options">
            <label>
              Tốc độ
              <select
                aria-label="Tốc độ nghe"
                value={state.rate}
                onChange={(event) => player.setRate(Number(event.target.value))}
              >
                {[0.5, 0.75, 0.8, 1, 1.2, 1.5].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}x
                  </option>
                ))}
              </select>
            </label>
            <label className="lp-check">
              <input
                type="checkbox"
                checked={state.repeat}
                onChange={(e) => configure(e.target.checked, state.autoAdvance)}
              />
              Lặp câu
            </label>
            {mode === 'reading' && (
              <label className="lp-check">
                <input
                  type="checkbox"
                  checked={state.autoAdvance}
                  onChange={(e) => configure(state.repeat, e.target.checked)}
                />
                Nghe liên tục
              </label>
            )}
          </div>
          {state.error && (
            <p role="alert" className="lp-error">
              {state.error}
            </p>
          )}
          <details
            className="lp-resources"
            open={resourcesOpen}
            onToggle={(e) => setResourcesOpen(e.currentTarget.open)}
          >
            <summary>Transcript và từ vựng</summary>
            <div className="lp-tabs" aria-label="Tài liệu hỗ trợ">
              <button
                type="button"
                aria-pressed={panel === 'transcript'}
                onClick={() => setPanel('transcript')}
              >
                Transcript
              </button>
              <button
                type="button"
                aria-pressed={panel === 'vocabulary'}
                onClick={() => setPanel('vocabulary')}
              >
                Từ vựng
              </button>
            </div>
            {panel === 'vocabulary' ? (
              <VocabularyPanel segments={segments} onLookup={openLookup} />
            ) : (
              <>
                <label className="lp-check">
                  <input
                    type="checkbox"
                    checked={revealTranscript}
                    disabled={['reading', 'meaning', 'aloud'].includes(mode)}
                    onChange={(e) => setShowTranscript(e.target.checked)}
                  />
                  Hiện nội dung transcript
                </label>
                <nav className="lp-transcript" aria-label="Các đoạn trong bài">
                  {segments.map((s, index) => {
                    const done =
                      exerciseMode !== 'reading' &&
                      latest.has(`${s.id}:${exerciseMode}`);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        aria-current={
                          index === state.index ? 'true' : undefined
                        }
                        onClick={() => chooseSentence(index)}
                      >
                        <span>
                          {index + 1}.{' '}
                          {revealTranscript
                            ? s.english
                            : s.english
                                .split(/\s+/)
                                .map((w) => '•'.repeat(Math.min(8, w.length)))
                                .join(' ')}
                        </span>
                        <small>
                          {formatSegmentTime(s.time_start)} –{' '}
                          {formatSegmentTime(s.time_end)}
                          {done ? ' · Đã làm' : ''}
                        </small>
                      </button>
                    );
                  })}
                </nav>
              </>
            )}
          </details>
        </aside>
        <div
          role="separator"
          aria-label="Điều chỉnh độ rộng khung nghe"
          aria-orientation="vertical"
          aria-valuemin={25}
          aria-valuemax={55}
          aria-valuenow={Math.round(sidebarWidth)}
          tabIndex={0}
          className="lp-resizer"
          onPointerDown={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              setSidebarWidth((value) =>
                Math.max(
                  25,
                  Math.min(55, value + (e.key === 'ArrowRight' ? 2 : -2)),
                ),
              );
            }
          }}
        />
        <section className="lp-main">
          <div className="lp-tabs lp-mode-tabs" aria-label="Chế độ luyện tập">
            {(Object.keys(MODE_LABELS) as PracticeMode[]).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={mode === value}
                onClick={() => changeMode(value)}
              >
                {MODE_LABELS[value]}
              </button>
            ))}
          </div>
          {mode === 'mixed' && (
            <ol className="lp-mixed-steps">
              {settings.mixedModes.map((value, i) => (
                <li
                  key={value}
                  aria-current={effectiveStep === i ? 'step' : undefined}
                >
                  {i + 1}. {MODE_LABELS[value]}
                </li>
              ))}
            </ol>
          )}
          {review ? (
            <ListeningReview
              segments={segments}
              attempts={attempts}
              modes={activeModes}
              onClose={() => setReview(false)}
              onRetry={(index, value) => {
                pause();
                setMode(value);
                select(index);
                setStep(0);
                setRetry((n) => n + 1);
                setReview(false);
              }}
            />
          ) : exerciseMode === 'reading' ? (
            <ReadingPractice
              segments={segments}
              index={state.index}
              settings={settings}
              onChange={onSettings}
              onSelect={chooseSentence}
              onAloud={(index) => {
                pause();
                select(index);
                changeMode('aloud');
              }}
              onLookup={openLookup}
            />
          ) : exerciseMode === 'aloud' ? (
            <ReadAloudPractice
              key={exerciseKey}
              segment={segment}
              onGrade={onGrade}
              onNext={onNext}
              onPause={pause}
              onReplay={onReplay}
              onBusyChange={setRecorderBusy}
              autoNext={settings.autoNext && !lookup}
            />
          ) : (
            <TextExercise
              key={exerciseKey}
              segment={segment}
              mode={exerciseMode}
              settings={settings}
              suspendAutoNext={!!lookup}
              distractors={distractors}
              onGrade={onGrade}
              onNext={onNext}
              onReplay={onReplay}
              onPause={pause}
            />
          )}
          <details className="lp-shortcuts">
            <summary>Phím tắt và cách tính điểm</summary>
            <p>
              Trong bài tập: R nghe lại · Shift+R nghe chậm · S bỏ qua · H hé
              chữ đầu khi chép. Khi đang gõ, dùng Ctrl+R / Ctrl+Shift+R / Ctrl+S
              / Ctrl+H. Enter nộp bài; Shift+Enter xuống dòng.
            </p>
            <p>
              Đạt mục tiêu từ 80%. Điền từ chấm trên các ô trống. Chép chính tả
              và nghĩa tham khảo bỏ qua viết hoa, dấu câu; không bỏ dấu tiếng
              Việt. Bài đã dùng gợi ý được ghi rõ trong kết quả.
            </p>
          </details>
        </section>
      </div>
      {lookup && (
        <WordDetail
          key={`${lookup.segment.id}:${lookup.word}`}
          {...lookup}
          signedIn={!!userId}
          source={{
            type: 'lesson',
            id: lesson.id,
            startTime: lookup.segment.time_start,
            endTime: lookup.segment.time_end,
          }}
          onClose={() => setLookup(null)}
        />
      )}
    </main>
  );
}
