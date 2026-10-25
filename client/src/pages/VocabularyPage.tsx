import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Loader2,
  RotateCw,
  Search,
} from 'lucide-react';
import MobileLayout from '../components/MobileLayout';
import StickyPageHeader from '../components/StickyPageHeader';
import { useAuth } from '../contexts/AuthContext';
import {
  api,
  type SavedVocabularyLibrary,
  type SavedVocabularyQuery,
  type SavedVocabularyWord,
} from '../lib/api';
import {
  SAVED_VOCABULARY_CHANGED,
  vocabularyChanged,
} from '../lib/savedVocabulary';
import SavedWordDetail from '../features/vocabulary/SavedWordDetail';
import VocabularyReview from '../features/vocabulary/VocabularyReview';
import { SpeakButton, StatusBadge } from '../features/vocabulary/WordContent';
import '../features/vocabulary/vocabulary.css';
import { peekCache } from '../lib/prefetchCache';
import { PageDataKeys } from '../lib/pageDataCache';

const empty: SavedVocabularyLibrary = {
  words: [],
  stats: { total: 0, due: 0, mastered: 0 },
  sources: [],
};

export default function VocabularyPage() {
  const { user, loading } = useAuth();
  return (
    <div className="vocabulary-shell">
      <VocabularyLibrary
        key={user?.id ?? 'guest'}
        signedIn={!!user}
        authLoading={loading}
      />
    </div>
  );
}
function VocabularyLibrary({
  signedIn,
  authLoading,
}: {
  signedIn: boolean;
  authLoading: boolean;
}) {
  const [data, setData] = useState(() =>
    signedIn
      ? (peekCache<SavedVocabularyLibrary>(PageDataKeys.savedVocabulary()) ??
        empty)
      : empty,
  );
  const [status, setStatus] = useState<'all' | 'due' | 'mastered'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(
    signedIn && !peekCache(PageDataKeys.savedVocabulary()),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [selected, setSelected] = useState<SavedVocabularyWord | null>(null);
  const [session, setSession] = useState<{
    words: SavedVocabularyWord[];
  } | null>(null);
  const [revision, setRevision] = useState(0);
  const query: SavedVocabularyQuery = { status, search };
  useEffect(() => {
    const changed = () => setRevision((value) => value + 1);
    window.addEventListener(SAVED_VOCABULARY_CHANGED, changed);
    return () => window.removeEventListener(SAVED_VOCABULARY_CHANGED, changed);
  }, []);
  useEffect(() => {
    if (!signedIn) return;
    const controller = new AbortController();
    const cached = peekCache<SavedVocabularyLibrary>(
      PageDataKeys.savedVocabulary({ status, search }),
    );
    if (cached) setData(cached);
    setLoading(!cached);
    setError('');
    const timer = window.setTimeout(
      () => {
        api
          .getSavedVocabulary({ status, search }, controller.signal)
          .then((result) => {
            if (!controller.signal.aborted) setData(result);
          })
          .catch((reason) => {
            if (!controller.signal.aborted)
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'Không tải được sổ từ.',
              );
          })
          .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
          });
      },
      search ? 250 : 0,
    );
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [signedIn, status, search, revision]);

  async function start(params: SavedVocabularyQuery) {
    if (busy) return;
    setBusy(true);
    setError('');
    setDetailError('');
    try {
      const result = await api.getSavedVocabularySession(params);
      if (!result.words.length) {
        setError('Không có từ phù hợp để ôn. Bạn có thể chọn bộ lọc khác.');
        setSelected(null);
        return;
      }
      setSelected(null);
      setSession({ words: result.words });
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : 'Không mở được lượt ôn.';
      setError(message);
      setDetailError(message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!selected || busy) return;
    setBusy(true);
    setDetailError('');
    try {
      await api.removeSavedVocabulary(selected.id);
      setData((current) => ({
        ...current,
        words: current.words.filter((word) => word.id !== selected.id),
      }));
      setSelected(null);
      vocabularyChanged();
    } catch (reason) {
      setDetailError(
        reason instanceof Error ? reason.message : 'Chưa bỏ lưu được từ.',
      );
    } finally {
      setBusy(false);
    }
  }
  const heading =
    status === 'mastered'
      ? 'Đã nhớ'
      : status === 'due'
        ? 'Cần ôn'
        : 'Từ đã lưu';
  if (session)
    return (
      <MobileLayout showNav={false}>
        <VocabularyReview
          words={session.words}
          onClose={() => {
            setSession(null);
            setRevision((value) => value + 1);
          }}
        />
      </MobileLayout>
    );
  return (
    <MobileLayout>
      <main className="vw-library">
        <StickyPageHeader className="-mx-5 px-5 pb-5 pt-[max(16px,env(safe-area-inset-top))]">
          <header className="relative flex h-11 items-center justify-center px-11 text-slate-900 dark:text-[#f4f4ef]">
            <Link
              to="/"
              aria-label="Trở về trang chủ"
              className="absolute -left-2 inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-teal-600 dark:hover:bg-white/10 dark:focus-visible:outline-teal-400"
            >
              <ChevronLeft size={28} />
            </Link>
            <h1 className="truncate text-sm font-semibold">Từ vựng</h1>
          </header>
        </StickyPageHeader>
        {authLoading ? (
          <div role="status" className="vw-empty">
            <Loader2 className="animate-spin" />
            Đang mở sổ từ…
          </div>
        ) : !signedIn ? (
          <section className="vw-empty">
            <BookOpen size={44} />
            <h2>Sổ từ vựng của bạn</h2>
            <p>Đăng nhập để lưu từ yêu thích và ôn tập mọi lúc, mọi nơi</p>
            <Link
              className="vw-primary"
              to="/dang-nhap"
              state={{ from: '/tu-vung' }}
            >
              Đăng nhập
            </Link>
          </section>
        ) : (
          <>
            <section className="vw-stats" aria-label="Thống kê từ đã lưu">
              <span>
                <strong>{data.stats.total}</strong>Đã lưu
              </span>
              <span>
                <strong>{data.stats.due}</strong>Cần ôn
              </span>
              <span>
                <strong>{data.stats.mastered}</strong>Đã nhớ
              </span>
            </section>
            <button
              type="button"
              className="vw-primary vw-all-review"
              disabled={busy || loading || !data.stats.total}
              onClick={() => void start({ status: 'all' })}
            >
              <BookOpen size={23} />
              Ôn tất cả · {data.stats.total} từ
              <ChevronRight size={22} />
            </button>
            <p className="vw-global-hint">Bao gồm cả từ đã nhớ</p>
            <label className="vw-search">
              <Search size={22} />
              <span className="sr-only">Tìm từ đã lưu</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm từ đã lưu…"
              />
            </label>
            <div
              className="vw-filters"
              role="group"
              aria-label="Trạng thái từ vựng"
            >
              {(
                [
                  ['all', 'Tất cả', data.stats.total],
                  ['due', 'Cần ôn', data.stats.due],
                  ['mastered', 'Đã nhớ', data.stats.mastered],
                ] as const
              ).map(([value, title, count]) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={status === value}
                  onClick={() => setStatus(value)}
                >
                  {title}
                  <span>{count}</span>
                </button>
              ))}
            </div>
            <div className="vw-list-heading">
              <div>
                <h2>
                  {heading} · {data.words.length} từ
                </h2>
                <p>
                  {status === 'mastered'
                    ? `Ôn lại ${data.words.length} từ đã nhớ`
                    : status === 'due'
                      ? 'Ưu tiên những từ đến lượt ôn'
                      : 'Ôn lại các từ đang hiển thị'}
                </p>
              </div>
              <button
                type="button"
                className="vw-outline"
                disabled={busy || loading || !data.words.length}
                onClick={() => void start(query)}
              >
                <RotateCw size={20} />
                Ôn lại
              </button>
            </div>
            {error && (
              <div className="vw-error" role="alert">
                <p>{error}</p>
                <button
                  type="button"
                  className="vw-text-link"
                  onClick={() => setRevision((value) => value + 1)}
                >
                  Thử lại
                </button>
              </div>
            )}
            {loading ? (
              <div role="status" className="vw-loading">
                <Loader2 className="animate-spin" size={22} />
                Đang tải từ đã lưu…
              </div>
            ) : !data.words.length && !error ? (
              <section className="vw-empty">
                <BookOpen size={38} />
                <h2>
                  {data.stats.total
                    ? 'Chưa có từ phù hợp'
                    : 'Lưu từ đầu tiên của bạn'}
                </h2>
                <p>
                  {data.stats.total
                    ? 'Thử đổi bộ lọc hoặc từ khóa tìm kiếm.'
                    : 'Chạm vào một từ khi học podcast hoặc bài học trong Khám phá, rồi chọn “Lưu từ vựng”.'}
                </p>
                {!data.stats.total && (
                  <Link className="vw-primary" to="/kham-pha">
                    Khám phá bài nghe
                  </Link>
                )}
              </section>
            ) : (
              <ul className="vw-word-list">
                {data.words.map((word) => {
                  const origin = word.sources[0];
                  return (
                    <li key={word.id}>
                      <button
                        type="button"
                        className="vw-word-open"
                        aria-label={`Chi tiết từ ${word.word}`}
                        onClick={() => {
                          setSelected(word);
                          setDetailError('');
                        }}
                      >
                        <strong lang="en">{word.word}</strong>
                        {word.phonetic && (
                          <span className="vw-list-phonetic">
                            {word.phonetic}
                          </span>
                        )}
                        <span>{word.meaning}</span>
                        {origin && (
                          <small>
                            <Headphones size={15} />
                            {origin.title}
                          </small>
                        )}
                      </button>
                      <div className="vw-row-actions">
                        <StatusBadge word={word} />
                        <SpeakButton text={word.word} />
                        <button
                          type="button"
                          className="vw-icon-button vw-chevron"
                          aria-label={`Mở từ ${word.word}`}
                          onClick={() => {
                            setSelected(word);
                            setDetailError('');
                          }}
                        >
                          <ChevronRight size={21} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
        {selected && (
          <SavedWordDetail
            word={selected}
            busy={busy}
            error={detailError}
            onClose={() => setSelected(null)}
            onRemove={() => void remove()}
            onReview={() => void start({ wordId: selected.id })}
          />
        )}
      </main>
    </MobileLayout>
  );
}
