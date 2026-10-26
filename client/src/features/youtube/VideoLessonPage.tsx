import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Crown,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { api, type VideoTranslateSegment } from '../../lib/api';
import { loadYoutubeApi, type YoutubePlayer } from '../../lib/youtubePlayer';
import LessonWordDetailSheet from '../../components/LessonWordDetailSheet';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useShadowing } from '../../hooks/useShadowing';
import { speakEnglishText } from '../../lib/speech';
import { scrollSentenceIntoView } from '../../lib/transcriptScroll';
import VideoLessonToolbar from './VideoLessonToolbar';
import VideoTranscriptRow from './VideoTranscriptRow';
import { activeTranscriptWord, transcriptWords } from './transcriptWords';
import { useVideoVocabulary } from './useVideoVocabulary';
import { usePodcastAccess } from '../podcast/usePodcastAccess';
import PodcastPremiumDialog from '../podcast/PodcastPremiumDialog';
import {
  CHANNEL_PATH,
  VOLKA_VIDEOS,
  videoTime,
  videoFavoriteId,
  type VolkaVideo,
} from './catalog';

export default function VideoLessonPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const video = VOLKA_VIDEOS.find((item) => item.id === videoId);
  if (!video) {
    return (
      <main className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="font-semibold">Không tìm thấy bài học video</h1>
        <Link to={CHANNEL_PATH} className="mt-4 inline-block text-primary">
          Trở về kênh Volka English
        </Link>
      </main>
    );
  }
  return <VideoLesson key={video.id} video={video} />;
}

export function VideoLesson({
  video,
  backTo = CHANNEL_PATH,
  backLabel = 'Trở về kênh Volka English',
}: {
  video: Pick<VolkaVideo, 'id' | 'title' | 'duration'>;
  backTo?: string;
  backLabel?: string;
}) {
  const [searchParams] = useSearchParams();
  const replayStart = searchParams.has('t')
    ? Number(searchParams.get('t'))
    : null;
  const replayEnd = useRef<number | null>(
    searchParams.has('end') ? Number(searchParams.get('end')) : null,
  );
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Array<HTMLElement | null>>([]);
  const previousSentenceRef = useRef(-1);
  const loopRef = useRef(false);
  const rateRef = useRef(1);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(video.duration);
  const [playerError, setPlayerError] = useState('');
  const [playerAttempt, setPlayerAttempt] = useState(0);
  const [segments, setSegments] = useState<VideoTranslateSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcriptError, setTranscriptError] = useState('');
  const [transcriptAttempt, setTranscriptAttempt] = useState(0);
  const [showTranslation, setShowTranslation] = useState(true);
  const [rate, setRate] = useState(1);
  const [looping, setLooping] = useState(false);
  const [shadowingIndex, setShadowingIndex] = useState<number | null>(null);
  const policy = usePodcastAccess(video.id);
  const accessReady = policy.access !== null;
  const previewLimit = policy.access?.previewLimitSeconds ?? null;
  const [premiumOpen, setPremiumOpen] = useState(false);
  const premiumOpenRef = useRef(false);
  const replayDeadlineRef = useRef<number | null>(null);
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(videoFavoriteId(video.id));
  const {
    result: shadowingResult,
    error: shadowingError,
    isRecording,
    isFetching,
    toggleRecording,
    reset: resetShadowing,
  } = useShadowing();
  const interactionLocked =
    isRecording || isFetching || premiumOpen || !accessReady;
  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
    setPlaying(false);
  }, []);
  const vocabulary = useVideoVocabulary(pause, video.id);
  const visibleSegments = useMemo(
    () =>
      !accessReady
        ? []
        : previewLimit === null
          ? segments
          : segments.filter((segment) => segment.end <= previewLimit),
    [segments, accessReady, previewLimit],
  );
  const lockPreview = useCallback(
    (target = playerRef.current) => {
      replayDeadlineRef.current = null;
      // Native pause/seek commands emit more player events. Do not seek again
      // while the gate is open, or those events can trigger a buffering loop.
      if (premiumOpenRef.current) {
        target?.pauseVideo();
        return;
      }
      premiumOpenRef.current = true;
      target?.pauseVideo();
      if (previewLimit !== null) {
        target?.seekTo(previewLimit, true);
        setTime(previewLimit);
      }
      setPlaying(false);
      setPremiumOpen(true);
      if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
    },
    [previewLimit],
  );
  const enforcePreview = useCallback(
    (target: YoutubePlayer) => {
      const current = target.getCurrentTime();
      if (replayDeadlineRef.current !== null) {
        // The iframe can keep reporting the old cutoff while a restart is
        // loading. Wait for an acknowledged rewind instead of reopening the gate.
        if (current >= 0 && current < Math.min(1, previewLimit ?? 1)) {
          replayDeadlineRef.current = null;
          target.setPlaybackRate(rateRef.current);
        } else if (Date.now() < replayDeadlineRef.current) {
          return true;
        } else {
          lockPreview(target);
          return true;
        }
      }
      if (
        premiumOpenRef.current ||
        (previewLimit !== null && current >= previewLimit)
      ) {
        lockPreview(target);
        return true;
      }
      return false;
    },
    [previewLimit, lockPreview],
  );
  useEffect(() => {
    replayDeadlineRef.current = null;
    premiumOpenRef.current = false;
    setPremiumOpen(false);
    if (accessReady && previewLimit === 0) lockPreview();
  }, [accessReady, previewLimit, lockPreview]);
  useEffect(() => {
    if (premiumOpen || !accessReady) vocabulary.close();
  }, [premiumOpen, accessReady]);
  const wordsBySegment = useMemo(
    () => visibleSegments.map(transcriptWords),
    [visibleSegments],
  );
  const setRowRef = useCallback(
    (element: HTMLElement | null, index: number) => {
      rowRefs.current[index] = element;
    },
    [],
  );
  const activeIndex = visibleSegments.findLastIndex(
    (segment) => segment.start <= time + 0.05,
  );

  useEffect(() => {
    setSegments([]);
    if (!accessReady || previewLimit === 0) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let timer: number | undefined;
    const started = Date.now();
    setLoading(true);
    setTranscriptError('');
    const load = async (prepare: boolean) => {
      try {
        const result = await (prepare
          ? api.prepareFeaturedVideoTranscript(video.id, controller.signal)
          : api.getFeaturedVideoTranscript(video.id, controller.signal));
        if (controller.signal.aborted) return;
        if (result.status === 'READY') {
          setSegments(result.segments);
          setLoading(false);
        } else if (result.status === 'FAILED') {
          setTranscriptError(
            result.errorMessage || 'Chưa tải được phụ đề. Vui lòng thử lại.',
          );
          setLoading(false);
        } else if (Date.now() - started >= 300_000) {
          setTranscriptError(
            'Phụ đề vẫn đang được chuẩn bị. Hãy thử tải lại sau ít phút.',
          );
          setLoading(false);
        } else {
          timer = window.setTimeout(() => void load(false), 2000);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setTranscriptError(
          error instanceof Error ? error.message : 'Không tải được phụ đề.',
        );
        setLoading(false);
      }
    };
    void load(true);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [video.id, transcriptAttempt, accessReady, previewLimit]);

  useEffect(() => {
    let cancelled = false;
    let interval: number | undefined;
    let player: YoutubePlayer | undefined;
    setReady(false);
    setPlaying(false);
    setPlayerError('');
    if (!accessReady || previewLimit === 0) return;
    const timeout = window.setTimeout(() => {
      if (!cancelled)
        setPlayerError(
          'Không kết nối được với YouTube. Hãy kiểm tra mạng và thử lại.',
        );
    }, 25_000);
    void loadYoutubeApi()
      .then(() => {
        if (cancelled || !mountRef.current || !window.YT) return;
        const element = document.createElement('div');
        mountRef.current.replaceChildren(element);
        player = new window.YT.Player(element, {
          videoId: video.id,
          width: '100%',
          height: '100%',
          playerVars: {
            playsinline: 1,
            controls: 1,
            rel: 0,
            origin: window.location.origin,
            ...(previewLimit !== null ? { end: previewLimit } : {}),
          },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              window.clearTimeout(timeout);
              playerRef.current = target;
              target.setPlaybackRate(rateRef.current);
              if (
                replayStart !== null &&
                Number.isFinite(replayStart) &&
                replayStart >= 0 &&
                replayStart < video.duration
              ) {
                if (previewLimit !== null && replayStart >= previewLimit)
                  lockPreview(target);
                else {
                  target.seekTo(replayStart, true);
                  target.playVideo();
                }
              }
              setReady(true);
              setPlayerError('');
              const actualDuration = target.getDuration();
              if (actualDuration > 0) setDuration(actualDuration);
              interval = window.setInterval(() => {
                if (enforcePreview(target)) return;
                const current = target.getCurrentTime();
                setTime(current);
                if (
                  replayEnd.current !== null &&
                  current >= replayEnd.current
                ) {
                  target.pauseVideo();
                  replayEnd.current = null;
                }
              }, 100);
            },
            onStateChange: ({ data, target }) => {
              if (cancelled) return;
              if (enforcePreview(target)) return;
              if (
                previewLimit !== null &&
                data === window.YT?.PlayerState.ENDED
              ) {
                // ENDED from the previous pass may arrive after the rewind.
                // Native end events can also stop just short of the exact limit.
                if (target.getCurrentTime() >= previewLimit - 0.5)
                  lockPreview(target);
                return;
              }
              if (data === window.YT?.PlayerState.ENDED && loopRef.current) {
                target.seekTo(0, true);
                target.playVideo();
                setTime(0);
                return;
              }
              setPlaying(data === window.YT?.PlayerState.PLAYING);
            },
            onError: () => {
              if (cancelled) return;
              window.clearTimeout(timeout);
              setReady(false);
              setPlaying(false);
              setPlayerError(
                'Video hiện không phát được trong ứng dụng. Bạn có thể thử lại hoặc mở trên YouTube.',
              );
            },
          },
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          window.clearTimeout(timeout);
          setPlayerError(
            error instanceof Error ? error.message : 'Không tải được video.',
          );
        }
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      replayDeadlineRef.current = null;
      playerRef.current = null;
      player?.destroy();
    };
  }, [
    video.id,
    playerAttempt,
    accessReady,
    previewLimit,
    enforcePreview,
    lockPreview,
  ]);

  useEffect(() => {
    const list = listRef.current;
    const row = rowRefs.current[activeIndex];
    if (!list || !row) return;
    const previous = previousSentenceRef.current;
    if (activeIndex === previous) return;
    previousSentenceRef.current = activeIndex;
    const behavior =
      previous >= 0 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'smooth'
        : 'auto';
    let cancelScroll: (() => void) | undefined;
    const frame = requestAnimationFrame(() => {
      cancelScroll = scrollSentenceIntoView(list, row, behavior);
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelScroll?.();
    };
  }, [activeIndex]);

  const seek = useCallback(
    (nextTime: number, play = false) => {
      const next = Math.max(0, Math.min(duration, nextTime));
      if (!accessReady) return;
      if (previewLimit !== null && next >= previewLimit) {
        lockPreview();
        return;
      }
      playerRef.current?.seekTo(next, true);
      setTime(next);
      if (play) playerRef.current?.playVideo();
    },
    [duration, accessReady, previewLimit, lockPreview],
  );

  const replayFromStart = useCallback(() => {
    const player = playerRef.current;
    if (!player || !accessReady || previewLimit === 0) return;
    if (replayDeadlineRef.current !== null) return;
    replayDeadlineRef.current = Date.now() + 10_000;
    premiumOpenRef.current = false;
    setPremiumOpen(false);
    replayEnd.current = null;
    setTime(0);
    setPlaying(false);
    // Reloading the same video starts playback and reapplies the native end
    // boundary, which seekTo would otherwise discard inside the YouTube player.
    player.loadVideoById({
      videoId: video.id,
      startSeconds: 0,
      ...(previewLimit !== null ? { endSeconds: previewLimit } : {}),
    });
  }, [video.id, accessReady, previewLimit]);

  const playSentence = useCallback(
    (index: number) => {
      const segment = visibleSegments[index];
      if (segment) seek(segment.start, true);
    },
    [seek, visibleSegments],
  );

  function toggleLoop() {
    if (
      !accessReady ||
      (playerRef.current && enforcePreview(playerRef.current))
    )
      return;
    loopRef.current = !loopRef.current;
    setLooping(loopRef.current);
    if (loopRef.current) {
      if (time >= duration - 0.1) seek(0);
      playerRef.current?.playVideo();
    }
  }

  function speak() {
    if (isFetching) return;
    const index = isRecording ? shadowingIndex : Math.max(0, activeIndex);
    const segment = index === null ? undefined : visibleSegments[index];
    if (!segment) return;
    pause();
    if (!isRecording) {
      resetShadowing();
      setShadowingIndex(index);
    }
    void toggleRecording(segment.en);
  }

  return (
    <main className="bg-[#f8f9fb] text-[#142034] dark:bg-neutral-950 dark:text-neutral-100">
      <div
        inert={premiumOpen}
        className="mx-auto flex h-dvh min-h-[600px] max-w-lg flex-col"
      >
        <header className="relative flex min-h-13 shrink-0 items-center justify-center border-b border-slate-100 bg-white px-14 py-3 dark:border-neutral-800 dark:bg-neutral-900">
          <Link
            to={backTo}
            aria-label={backLabel}
            className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-neutral-800"
          >
            <ChevronLeft size={23} />
          </Link>
          <h1
            className="line-clamp-1 text-center text-sm font-semibold"
            title={video.title}
          >
            {video.title}
          </h1>
        </header>
        <section aria-label="Trình phát bài học" className="shrink-0">
          <div className="relative aspect-video bg-black">
            <div
              ref={mountRef}
              inert={interactionLocked}
              className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full"
            />
            {accessReady && previewLimit === 0 && (
              <button
                type="button"
                onClick={() => lockPreview()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-white"
              >
                <Crown size={36} />
                <span className="font-semibold">Podcast Premium</span>
                <span className="text-sm text-violet-200">
                  Nâng cấp để nghe trọn bài
                </span>
              </button>
            )}
            {!ready && !playerError && !policy.error && previewLimit !== 0 && (
              <div
                role="status"
                className="pointer-events-none absolute inset-0 flex items-center justify-center text-white"
              >
                <Loader2 className="animate-spin" size={28} />
                <span className="sr-only">Đang tải video</span>
              </div>
            )}
          </div>
          {(playerError || policy.error) && (
            <div
              role="alert"
              className="space-y-2 bg-slate-100 px-4 py-3 text-xs leading-5 dark:bg-neutral-900"
            >
              <p>{policy.error || playerError}</p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() =>
                    policy.error
                      ? policy.retry()
                      : setPlayerAttempt((attempt) => attempt + 1)
                  }
                  className="font-semibold text-primary"
                >
                  Thử lại
                </button>
                <a
                  href={`https://www.youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary"
                >
                  Mở YouTube <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
          <div className="border-b border-slate-100 bg-white px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-2 text-[10px] tabular-nums text-slate-500 dark:text-neutral-400">
              <span>{videoTime(time)}</span>
              <input
                aria-label="Tiến độ video"
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={Math.min(time, duration)}
                disabled={!ready || interactionLocked}
                onChange={(event) => seek(Number(event.target.value))}
                className="h-1 min-w-0 flex-1 cursor-pointer accent-primary"
              />
              <span>{videoTime(duration)}</span>
            </div>
            <div className="mt-2 flex items-center justify-center gap-3">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={!ready || interactionLocked}
                  onClick={() => seek(time - 5)}
                  aria-label="Tua lại 5 giây"
                  className="flex h-10 w-10 items-center justify-center text-slate-500 disabled:opacity-40"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  type="button"
                  disabled={!ready || interactionLocked}
                  onClick={() =>
                    playing
                      ? playerRef.current?.pauseVideo()
                      : playerRef.current &&
                        !enforcePreview(playerRef.current) &&
                        playerRef.current.playVideo()
                  }
                  aria-label={playing ? 'Tạm dừng video' : 'Phát video'}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
                >
                  {playing ? (
                    <Pause size={21} fill="currentColor" />
                  ) : (
                    <Play size={21} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  disabled={!ready || interactionLocked}
                  onClick={() => seek(time + 5)}
                  aria-label="Tua tới 5 giây"
                  className="flex h-10 w-10 items-center justify-center text-slate-500 disabled:opacity-40"
                >
                  <RotateCw size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>
        <div
          ref={listRef}
          aria-label="Phụ đề bài học"
          aria-busy={loading}
          className={`min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 pt-4 ${previewLimit !== null ? 'pb-4' : 'pb-[45vh]'}`}
        >
          {loading && (
            <div
              role="status"
              className="rounded-2xl bg-primary/5 px-5 py-8 text-center text-sm text-slate-500 dark:text-neutral-400"
            >
              <Loader2
                className="mx-auto mb-3 animate-spin text-primary"
                size={24}
              />
              <p className="font-medium text-slate-700 dark:text-neutral-200">
                Đang chuẩn bị phụ đề song ngữ
              </p>
              <p className="mt-2 text-xs leading-5">
                Lần mở đầu tiên có thể mất vài phút. Bạn có thể xem video trong
                lúc chờ.
              </p>
            </div>
          )}
          {transcriptError && (
            <div
              role="alert"
              className="rounded-2xl bg-primary/5 px-5 py-6 text-center text-sm leading-6 text-slate-500 dark:text-neutral-400"
            >
              <p>{transcriptError}</p>
              <button
                type="button"
                onClick={() => setTranscriptAttempt((attempt) => attempt + 1)}
                className="mt-3 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white"
              >
                Tải lại phụ đề
              </button>
            </div>
          )}
          {!loading &&
            !transcriptError &&
            accessReady &&
            previewLimit !== 0 &&
            !visibleSegments.length && (
              <p className="py-8 text-center text-sm text-slate-500">
                Video chưa có phụ đề.
              </p>
            )}
          {visibleSegments.map((segment, index) => (
            <VideoTranscriptRow
              key={`${segment.start}-${index}`}
              segment={segment}
              index={index}
              words={wordsBySegment[index]}
              active={index === activeIndex}
              activeWord={
                playing && index === activeIndex
                  ? activeTranscriptWord(wordsBySegment[index], time)
                  : -1
              }
              playing={index === activeIndex && playing}
              disabled={!ready || interactionLocked}
              lookupDisabled={interactionLocked}
              translation={showTranslation}
              result={shadowingIndex === index ? shadowingResult : null}
              error={shadowingIndex === index ? shadowingError : ''}
              rowRef={setRowRef}
              onPlay={playSentence}
              onLookup={vocabulary.open}
            />
          ))}
        </div>
        <VideoLessonToolbar
          rate={rate}
          translation={showTranslation}
          saved={saved}
          looping={looping}
          ready={ready}
          speakingAvailable={visibleSegments.length > 0 && !interactionLocked}
          recording={isRecording}
          processing={isFetching}
          onRate={(value) => {
            rateRef.current = value;
            setRate(value);
            playerRef.current?.setPlaybackRate(value);
          }}
          onTranslation={() => setShowTranslation((value) => !value)}
          onSave={() => toggleFavorite(videoFavoriteId(video.id))}
          onLoop={toggleLoop}
          onSpeak={speak}
        />
        {vocabulary.context && (
          <LessonWordDetailSheet
            detail={vocabulary.detail}
            error={vocabulary.error}
            loading={vocabulary.loading}
            saving={vocabulary.saving}
            onSave={() => void vocabulary.save()}
            onClose={vocabulary.close}
            onRetry={vocabulary.retry}
            onLookupRelated={vocabulary.related}
            onSpeak={(text) => speakEnglishText(text, 0.75)}
          />
        )}
      </div>
      {premiumOpen && previewLimit !== null && (
        <PodcastPremiumDialog
          previewSeconds={previewLimit}
          backTo={backTo}
          onClose={replayFromStart}
          onReplay={replayFromStart}
        />
      )}
    </main>
  );
}
