import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { FileVideo, Loader2, Video } from 'lucide-react';
import {
  ApiError,
  api,
  type VideoTranslateJob,
  type VideoTranslateQuota,
} from '../../lib/api';

const VIDEO_SOURCE_SHEET_CLOSE_MS = 440;
const ACCEPT_LOCAL_MEDIA =
  'video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/webm,.mp4,.webm,.mov,.mp3,.m4a,.wav';
type VideoProcessingSource = 'youtube' | 'upload';

export default function AddVideoButton({
  returnTo = '/',
}: {
  returnTo?: string;
}) {
  const navigate = useNavigate();
  const [isVideoSourceOpen, setIsVideoSourceOpen] = useState(false);
  const [isVideoSourceClosing, setIsVideoSourceClosing] = useState(false);
  const [isYoutubeUrlDialogOpen, setIsYoutubeUrlDialogOpen] = useState(false);
  const [isLocalMediaDialogOpen, setIsLocalMediaDialogOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeUrlError, setYoutubeUrlError] = useState('');
  const [localMediaName, setLocalMediaName] = useState('');
  const [localMediaError, setLocalMediaError] = useState('');
  const [processingSource, setProcessingSource] =
    useState<VideoProcessingSource | null>(null);
  const [videoProcessingJob, setVideoProcessingJob] =
    useState<VideoTranslateJob | null>(null);
  const [youtubeSubmitting, setYoutubeSubmitting] = useState(false);
  const [localMediaSubmitting, setLocalMediaSubmitting] = useState(false);
  const videoSourceCloseTimerRef = useRef<number | null>(null);
  const videoProcessing =
    youtubeSubmitting ||
    localMediaSubmitting ||
    videoProcessingJob?.status === 'PENDING' ||
    videoProcessingJob?.status === 'PROCESSING';

  useEffect(() => {
    if (
      !isVideoSourceOpen &&
      !isYoutubeUrlDialogOpen &&
      !isLocalMediaDialogOpen
    ) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isLocalMediaDialogOpen) {
          if (!videoProcessing) {
            setIsLocalMediaDialogOpen(false);
            setLocalMediaError('');
          }
        } else if (isYoutubeUrlDialogOpen) {
          if (!videoProcessing) {
            setIsYoutubeUrlDialogOpen(false);
            setYoutubeUrlError('');
          }
        } else {
          closeVideoSourceSheet();
        }
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isVideoSourceOpen,
    isVideoSourceClosing,
    isYoutubeUrlDialogOpen,
    isLocalMediaDialogOpen,
    videoProcessing,
  ]);

  useEffect(() => {
    if (
      !videoProcessingJob ||
      (videoProcessingJob.status !== 'PENDING' &&
        videoProcessingJob.status !== 'PROCESSING')
    ) {
      return;
    }

    let cancelled = false;
    const poll = () => {
      void api
        .getVideoTranslateJob(videoProcessingJob.id)
        .then((result) => {
          if (cancelled) return;
          if (result.job.status === 'READY') {
            setIsYoutubeUrlDialogOpen(false);
            setIsLocalMediaDialogOpen(false);
            setVideoProcessingJob(null);
            navigate(`/dich-video?job=${encodeURIComponent(result.job.id)}`, {
              state: {
                videoTranslateJob: result.job,
                videoTranslateQuota: result.quota,
              },
            });
            return;
          }
          if (result.job.status === 'FAILED') {
            const message = result.job.errorMessage || 'Xử lý video thất bại';
            setVideoProcessingJob(null);
            if (processingSource === 'upload') {
              setLocalMediaError(message);
            } else {
              setYoutubeUrlError(message);
            }
            return;
          }
          setVideoProcessingJob(result.job);
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          const message =
            error instanceof Error
              ? error.message
              : 'Không kiểm tra được trạng thái video';
          setVideoProcessingJob(null);
          if (processingSource === 'upload') {
            setLocalMediaError(message);
          } else {
            setYoutubeUrlError(message);
          }
        });
    };

    poll();
    const timer = window.setInterval(poll, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    navigate,
    processingSource,
    videoProcessingJob?.id,
    videoProcessingJob?.status,
  ]);

  useEffect(
    () => () => {
      if (videoSourceCloseTimerRef.current !== null) {
        window.clearTimeout(videoSourceCloseTimerRef.current);
      }
    },
    [],
  );

  const finishClosingVideoSourceSheet = (
    destination?: string,
    onClosed?: () => void,
  ) => {
    setIsVideoSourceOpen(false);
    setIsVideoSourceClosing(false);
    videoSourceCloseTimerRef.current = null;
    if (destination) navigate(destination);
    onClosed?.();
  };

  const closeVideoSourceSheet = (
    destination?: string,
    onClosed?: () => void,
  ) => {
    if (isVideoSourceClosing) return;

    setIsVideoSourceClosing(true);
    videoSourceCloseTimerRef.current = window.setTimeout(
      () => finishClosingVideoSourceSheet(destination, onClosed),
      VIDEO_SOURCE_SHEET_CLOSE_MS,
    );
  };

  const openVideoSourceSheet = () => {
    if (videoSourceCloseTimerRef.current !== null) {
      window.clearTimeout(videoSourceCloseTimerRef.current);
      videoSourceCloseTimerRef.current = null;
    }
    setIsVideoSourceClosing(false);
    setIsVideoSourceOpen(true);
  };

  const openYoutubeUrlDialog = () => {
    closeVideoSourceSheet(undefined, () => {
      setYoutubeUrlError('');
      setProcessingSource('youtube');
      setVideoProcessingJob(null);
      setYoutubeSubmitting(false);
      setIsYoutubeUrlDialogOpen(true);
    });
  };

  const closeYoutubeUrlDialog = () => {
    if (videoProcessing) return;
    setIsYoutubeUrlDialogOpen(false);
    setYoutubeUrlError('');
    setProcessingSource(null);
  };

  const closeLocalMediaDialog = () => {
    if (videoProcessing) return;
    setIsLocalMediaDialogOpen(false);
    setLocalMediaError('');
    setLocalMediaName('');
    setProcessingSource(null);
  };

  const openReadyVideo = (
    readyJob: VideoTranslateJob,
    nextQuota: VideoTranslateQuota,
  ) => {
    setIsYoutubeUrlDialogOpen(false);
    setIsLocalMediaDialogOpen(false);
    setVideoProcessingJob(null);
    navigate(`/dich-video?job=${encodeURIComponent(readyJob.id)}`, {
      state: {
        videoTranslateJob: readyJob,
        videoTranslateQuota: nextQuota,
      },
    });
  };

  const submitYoutubeUrl = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextUrl = youtubeUrl.trim();
    if (!nextUrl) {
      setYoutubeUrlError('Vui lòng dán URL video Youtube');
      return;
    }

    setYoutubeUrlError('');
    setProcessingSource('youtube');
    setYoutubeSubmitting(true);
    try {
      const result = await api.createVideoTranslateJob(nextUrl);
      if (result.job.status === 'READY') {
        openReadyVideo(result.job, result.quota);
        return;
      }
      setVideoProcessingJob(result.job);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === 'VIDEO_TRANSLATE_QUOTA_EXCEEDED'
      ) {
        setIsYoutubeUrlDialogOpen(false);
        navigate('/nang-cap', {
          state: {
            from: returnTo,
            message:
              'Bạn đã hết lượt dịch video hôm nay. Nâng cấp Premium để tiếp tục.',
          },
        });
        return;
      }
      setYoutubeUrlError(
        error instanceof Error ? error.message : 'Không thể xử lý video',
      );
    } finally {
      setYoutubeSubmitting(false);
    }
  };

  const submitLocalMedia = async (file: File) => {
    setProcessingSource('upload');
    setLocalMediaName(file.name);
    setLocalMediaError('');
    setIsLocalMediaDialogOpen(true);
    setLocalMediaSubmitting(true);
    try {
      const result = await api.createVideoTranslateJobFromUpload(file);
      if (result.job.status === 'READY') {
        openReadyVideo(result.job, result.quota);
        return;
      }
      setVideoProcessingJob(result.job);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === 'VIDEO_TRANSLATE_QUOTA_EXCEEDED'
      ) {
        setIsLocalMediaDialogOpen(false);
        navigate('/nang-cap', {
          state: {
            from: returnTo,
            message:
              'Bạn đã hết lượt dịch video hôm nay. Nâng cấp Premium để tiếp tục.',
          },
        });
        return;
      }
      setLocalMediaError(
        error instanceof Error ? error.message : 'Không thể xử lý video',
      );
    } finally {
      setLocalMediaSubmitting(false);
    }
  };

  const startLocalMediaUpload = (file: File) => {
    const beginUpload = () => {
      void submitLocalMedia(file);
    };

    if (isVideoSourceOpen) {
      closeVideoSourceSheet(undefined, beginUpload);
    } else {
      beginUpload();
    }
  };

  const handleLocalMediaInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    event.currentTarget.value = '';
    if (file) startLocalMediaUpload(file);
  };

  return (
    <>
      <div className="pointer-events-none fixed bottom-[70px] left-1/2 z-40 w-full max-w-lg -translate-x-1/2">
        <button
          type="button"
          onClick={openVideoSourceSheet}
          className="pointer-events-auto absolute bottom-0 right-[20px] inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(79,70,229,0.32)] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.97]"
          aria-label="Thêm video"
          aria-haspopup="dialog"
          aria-expanded={
            isVideoSourceOpen ||
            isYoutubeUrlDialogOpen ||
            isLocalMediaDialogOpen
          }
        >
          <Video size={19} strokeWidth={2.6} aria-hidden="true" />
          <span>Thêm video</span>
        </button>
      </div>

      {isVideoSourceOpen && (
        <div
          className={`fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 backdrop-blur-[2px] ${
            isVideoSourceClosing
              ? 'video-source-backdrop-out pointer-events-none'
              : 'video-source-backdrop-in'
          }`}
          onClick={() => closeVideoSourceSheet()}
          role="presentation"
          data-state={isVideoSourceClosing ? 'closing' : 'open'}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-source-sheet-title"
            onClick={(event) => event.stopPropagation()}
            className={`w-full max-w-lg rounded-t-[28px] bg-white px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-7 text-slate-900 shadow-[0_-18px_60px_rgba(15,23,42,0.22)] will-change-transform dark:bg-neutral-900 dark:text-white ${
              isVideoSourceClosing
                ? 'video-source-sheet-out'
                : 'video-source-sheet-in'
            }`}
          >
            <h2
              id="video-source-sheet-title"
              className="text-[18px] font-bold leading-6"
            >
              Nhập Video hoặc Âm thanh
            </h2>
            <p className="mt-0.5 text-[13px] leading-5 text-slate-500 dark:text-neutral-400">
              Vui lòng chọn từ đâu để nhập tệp phương tiện
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={openYoutubeUrlDialog}
                className="flex min-h-[84px] w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left transition-colors hover:bg-slate-100 active:bg-slate-200/70 dark:border-neutral-700 dark:bg-neutral-800/70 dark:hover:bg-neutral-800"
              >
                <Video
                  size={24}
                  className="shrink-0 text-slate-600 dark:text-neutral-300"
                  fill="currentColor"
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-[16px] font-bold leading-5">
                    URL Youtube
                  </span>
                  <span className="mt-0.5 block max-w-[340px] text-[14px] leading-[19px] text-slate-500 dark:text-neutral-400">
                    Phát video Youtube trong ứng dụng, không cần tải xuống
                  </span>
                </span>
              </button>

              <div className="relative">
                <div className="pointer-events-none flex min-h-[84px] w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left transition-colors dark:border-neutral-700 dark:bg-neutral-800/70">
                  <FileVideo
                    size={24}
                    className="shrink-0 text-slate-600 dark:text-neutral-300"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-[16px] font-bold leading-5">
                      Phương tiện địa phương
                    </span>
                    <span className="mt-0.5 block max-w-[340px] text-[14px] leading-[19px] text-slate-500 dark:text-neutral-400">
                      Nhập tệp phương tiện từ bộ nhớ địa phương của bạn, không
                      cần sao chép
                    </span>
                  </span>
                </div>
                <input
                  type="file"
                  accept={ACCEPT_LOCAL_MEDIA}
                  aria-label="Chọn phương tiện địa phương"
                  onChange={handleLocalMediaInput}
                  className="absolute inset-0 h-full w-full cursor-pointer rounded-xl opacity-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {isYoutubeUrlDialogOpen && (
        <div
          className="lesson-word-backdrop-in fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 px-6 backdrop-blur-[2px]"
          onClick={closeYoutubeUrlDialog}
          role="presentation"
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="youtube-url-dialog-title"
            aria-busy={videoProcessing}
            onSubmit={submitYoutubeUrl}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[360px] rounded-[24px] bg-white p-5 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.28)] dark:bg-neutral-900 dark:text-white"
          >
            <h2
              id="youtube-url-dialog-title"
              className="text-[16px] font-bold leading-6"
            >
              {videoProcessing ? 'Đang xử lý video' : 'URL Youtube'}
            </h2>

            {videoProcessing ? (
              <div
                className="flex min-h-[156px] flex-col items-center justify-center px-3 text-center"
                aria-live="polite"
              >
                <Loader2
                  size={32}
                  className="animate-spin text-primary"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm font-bold">
                  Đang tạo phụ đề Youtube
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-neutral-400">
                  AI đang nhận dạng nội dung và dịch sang tiếng Việt. Giao diện
                  học sẽ tự động mở khi hoàn tất.
                </p>
              </div>
            ) : (
              <>
                <label htmlFor="home-youtube-url" className="sr-only">
                  URL video Youtube
                </label>
                <input
                  id="home-youtube-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  autoFocus
                  value={youtubeUrl}
                  onChange={(event) => {
                    setYoutubeUrl(event.target.value);
                    if (youtubeUrlError) setYoutubeUrlError('');
                  }}
                  placeholder="Dán URL video Youtube"
                  aria-invalid={Boolean(youtubeUrlError)}
                  aria-describedby={
                    youtubeUrlError ? 'home-youtube-url-error' : undefined
                  }
                  className={`mt-5 h-12 w-full rounded-xl border bg-transparent px-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 dark:bg-neutral-950 ${
                    youtubeUrlError
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-slate-300 focus:border-primary dark:border-neutral-700'
                  }`}
                />
                {youtubeUrlError && (
                  <p
                    id="home-youtube-url-error"
                    className="mt-1.5 text-xs text-red-500"
                  >
                    {youtubeUrlError}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={closeYoutubeUrlDialog}
                    className="h-11 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 active:bg-slate-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={!youtubeUrl.trim()}
                    className="h-11 rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-bold text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Lưu
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {isLocalMediaDialogOpen && (
        <div
          className="lesson-word-backdrop-in fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 px-6 backdrop-blur-[2px]"
          onClick={closeLocalMediaDialog}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="local-media-dialog-title"
            aria-busy={videoProcessing}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-[360px] rounded-[24px] bg-white p-5 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.28)] dark:bg-neutral-900 dark:text-white"
          >
            <h2
              id="local-media-dialog-title"
              className="text-[16px] font-bold leading-6"
            >
              {videoProcessing ? 'Đang xử lý video' : 'Phương tiện địa phương'}
            </h2>

            {videoProcessing ? (
              <div
                className="flex min-h-[176px] flex-col items-center justify-center px-3 text-center"
                aria-live="polite"
              >
                <Loader2
                  size={32}
                  className="animate-spin text-primary"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm font-bold">Đang tạo phụ đề</p>
                <p className="mt-1 max-w-full truncate text-xs font-medium text-slate-600 dark:text-neutral-300">
                  {localMediaName}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-neutral-400">
                  AI đang nhận dạng tiếng Anh và dịch sang tiếng Việt. Giao diện
                  học sẽ tự động mở khi hoàn tất.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-neutral-800">
                  <FileVideo
                    size={22}
                    className="shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <p className="min-w-0 truncate text-sm font-semibold">
                    {localMediaName}
                  </p>
                </div>

                {localMediaError && (
                  <p
                    className="mt-3 text-xs leading-5 text-red-500"
                    role="alert"
                  >
                    {localMediaError}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={closeLocalMediaDialog}
                    className="h-11 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 active:bg-slate-300 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  >
                    Đóng
                  </button>
                  <div className="relative">
                    <div className="pointer-events-none flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-bold text-white shadow-sm">
                      Chọn lại
                    </div>
                    <input
                      type="file"
                      accept={ACCEPT_LOCAL_MEDIA}
                      aria-label="Chọn lại phương tiện địa phương"
                      onChange={handleLocalMediaInput}
                      className="absolute inset-0 h-full w-full cursor-pointer rounded-xl opacity-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    />
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
