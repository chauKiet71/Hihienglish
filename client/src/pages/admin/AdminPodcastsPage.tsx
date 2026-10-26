import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { ArrowLeft, Eye, EyeOff, Plus, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import AdminContentTabs from '../../components/AdminContentTabs';
import { api } from '../../lib/api';
import type {
  CatalogChannel,
  CatalogImportJob,
  ImportMode,
} from '../../../../src/podcast/catalog.types';
import { videoTime } from '../../features/youtube/catalog';
import AdminPodcastPremiumSettings from './AdminPodcastPremiumSettings';
import PodcastAdminDialog from './PodcastAdminDialog';

const button =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40';
const primary = `${button} !border-primary !bg-primary !text-white`;
const field =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900';
const statusNames: Record<string, string> = {
  QUEUED: 'Đang chờ',
  RUNNING: 'Đang tìm video',
  READY: 'Chờ chọn video',
  IMPORTED: 'Đã nhập',
  FAILED: 'Lỗi',
  PENDING: 'Chưa tạo',
  PROCESSING: 'Đang xử lý',
};
const date = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('vi-VN') : 'Chưa đồng bộ';
const message = (reason: unknown) =>
  reason instanceof Error ? reason.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';

export default function AdminPodcastsPage() {
  const [channels, setChannels] = useState<CatalogChannel[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'channels' | 'premium'>('channels');
  const [channelId, setChannelId] = useState<string | null>(null);
  const currentChannelId = useRef(channelId);
  currentChannelId.current = channelId;
  const channel = channels.find((item) => item.id === channelId);
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [modal, setModal] = useState<'channel' | 'import' | null>(null);
  const [modalError, setModalError] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [mode, setMode] = useState<ImportMode>('OLDER');
  const [count, setCount] = useState('20');
  const [videoUrl, setVideoUrl] = useState('');
  const [job, setJob] = useState<CatalogImportJob | null>(null);
  const [jobs, setJobs] = useState<CatalogImportJob[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getAdminPodcastCatalog();
      setChannels(result.channels);
      setConfigured(result.youtubeConfigured);
    } catch (reason) {
      setError(message(reason));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const loadJobs = useCallback(async () => {
    if (!channelId) return;
    try {
      const result = await api.getPodcastImports(channelId);
      if (currentChannelId.current === channelId) setJobs(result);
    } catch (reason) {
      if (currentChannelId.current === channelId) setError(message(reason));
    }
  }, [channelId]);
  useEffect(() => {
    setJobs([]);
    void loadJobs();
  }, [loadJobs]);
  useEffect(() => {
    if (job?.status === 'READY')
      setSelected(job.candidates.map((video) => video.id));
  }, [job?.id, job?.status]);
  useEffect(() => {
    if (
      modal !== 'import' ||
      !job ||
      !['QUEUED', 'RUNNING'].includes(job.status)
    )
      return;
    let active = true;
    let pending = false;
    const poll = async () => {
      if (pending) return;
      pending = true;
      try {
        const result = await api.getPodcastImport(job.id);
        if (active) {
          setJob(result);
          setModalError('');
        }
      } catch (reason) {
        if (active) setModalError(message(reason));
      } finally {
        pending = false;
      }
    };
    const timer = window.setInterval(() => void poll(), 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [modal, job?.id, job?.status]);

  const close = () => {
    if (!busy) {
      setModal(null);
      void loadJobs();
    }
  };
  const openImport = (nextMode: ImportMode) => {
    setMode(nextMode);
    setJob(null);
    setModalError('');
    setSelected([]);
    setModal('import');
  };
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusy(false);
    }
  }
  async function addChannel(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setModalError('');
    try {
      await api.addPodcastChannel(channelUrl.trim());
      await load();
      setModal(null);
      setChannelUrl('');
      setNotice('Đã thêm kênh. Chọn Quản lý video để nhập các bài nghe.');
    } catch (reason) {
      setModalError(message(reason));
    } finally {
      setBusy(false);
    }
  }
  async function startImport(event: FormEvent) {
    event.preventDefault();
    if (!channel) return;
    setBusy(true);
    setModalError('');
    try {
      setJob(
        await api.startPodcastImport(channel.id, {
          mode,
          count: mode === 'URL' ? 1 : Number(count),
          ...(mode === 'URL' ? { videoUrl: videoUrl.trim() } : {}),
        }),
      );
    } catch (reason) {
      setModalError(message(reason));
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!job) return;
    setBusy(true);
    setModalError('');
    try {
      const result = await api.commitPodcastImport(job.id, selected);
      await load();
      await loadJobs();
      setModal(null);
      setNotice(
        `Đã thêm ${result.importedCount} video vào kênh. Video trùng được tự động bỏ qua.`,
      );
    } catch (reason) {
      setModalError(message(reason));
    } finally {
      setBusy(false);
    }
  }

  const videos = (channel?.videos ?? []).filter(
    (video) =>
      `${video.title} ${video.id}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (visibility === 'all' || video.isVisible === (visibility === 'visible')),
  );
  return (
    <AdminLayout
      title="Quản lý Podcast"
      subtitle="Thêm kênh, nhập video và quản lý quyền nghe Premium."
    >
      <AdminContentTabs />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          className={view === 'channels' ? primary : button}
          onClick={() => setView('channels')}
        >
          Kênh YouTube
        </button>
        <button
          className={view === 'premium' ? primary : button}
          onClick={() => setView('premium')}
        >
          Khóa Premium
        </button>
        <button
          aria-label="Tải lại danh sách kênh"
          disabled={loading || busy}
          onClick={() => void load()}
          className={`${button} ml-auto`}
        >
          <RefreshCw size={16} />
          Tải lại
        </button>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {notice}
        </p>
      )}
      {!configured && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          Chưa kết nối YouTube. Để thêm kênh và lấy video, hãy cấu hình{' '}
          <code>YOUTUBE_DATA_API_KEY</code> trên máy chủ và bật YouTube Data API
          v3. Bạn vẫn có thể quản lý video và Premium hiện có.
        </p>
      )}
      {view === 'premium' ? (
        <AdminPodcastPremiumSettings
          videos={channels.flatMap((item) => item.videos)}
        />
      ) : (
        <>
          {channel ? (
            <>
              <button
                className={`${button} mb-5`}
                onClick={() => {
                  setChannelId(null);
                  setQuery('');
                }}
              >
                <ArrowLeft size={16} />
                Tất cả kênh
              </button>
              <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-4">
                  <img
                    src={channel.avatarUrl}
                    alt=""
                    className="h-16 w-16 rounded-full bg-gray-100 object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {channel.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {channel.videos.filter((video) => video.isVisible).length}
                      /{channel.videos.length} video đang hiển thị ·{' '}
                      {channel.isVisible
                        ? 'Kênh đang hiển thị'
                        : 'Kênh đang ẩn'}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    disabled={!configured || busy}
                    className={primary}
                    onClick={() => openImport('OLDER')}
                  >
                    <Plus size={16} />
                    Lấy thêm video cũ
                  </button>
                  <button
                    disabled={!configured || busy}
                    className={button}
                    onClick={() => openImport('NEWER')}
                  >
                    <RefreshCw size={16} />
                    Cập nhật video mới
                  </button>
                  <button
                    disabled={!configured || busy}
                    className={button}
                    onClick={() => openImport('URL')}
                  >
                    Thêm bằng URL
                  </button>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  Đồng bộ gần nhất: {date(channel.lastSyncedAt)}
                </p>
              </section>
              {!!jobs.length && (
                <section
                  aria-label="Các phiên nhập gần đây"
                  className="mb-6 rounded-xl border border-gray-200 bg-white p-4"
                >
                  <h3 className="mb-3 font-semibold">Các phiên nhập gần đây</h3>
                  <div className="flex flex-wrap gap-2">
                    {jobs.map((item) => (
                      <button
                        key={item.id}
                        className={button}
                        onClick={() => {
                          setJob(item);
                          setMode(item.mode);
                          setVideoUrl(item.videoUrl || '');
                          setCount(String(item.requestedCount));
                          setModalError('');
                          setModal('import');
                        }}
                      >
                        {statusNames[item.status] || item.status} ·{' '}
                        {item.requestedCount} video · {date(item.createdAt)}
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <section className="rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-wrap gap-3 border-b border-gray-100 p-4">
                  <input
                    aria-label="Tìm video trong kênh"
                    placeholder="Tìm tên hoặc mã video…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className={`${field} min-w-48 flex-1`}
                  />
                  <select
                    aria-label="Lọc hiển thị video"
                    className={`${field} !w-auto`}
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value)}
                  >
                    <option value="all">Tất cả video</option>
                    <option value="visible">Đang hiển thị</option>
                    <option value="hidden">Đang ẩn</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="p-4">Video</th>
                        <th className="p-4">Thời lượng</th>
                        <th className="p-4">Phụ đề</th>
                        <th className="p-4">Hiển thị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos.map((video) => (
                        <tr key={video.id} className="border-b border-gray-100">
                          <td className="p-4">
                            <div className="flex min-w-64 items-center gap-3">
                              <img
                                src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
                                alt=""
                                loading="lazy"
                                className="aspect-video w-28 rounded-lg object-cover"
                              />
                              <div>
                                <a
                                  href={video.lessonPath}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="line-clamp-2 font-semibold text-gray-900 hover:text-primary"
                                >
                                  {video.title}
                                </a>
                                <p className="mt-1 text-xs text-gray-400">
                                  {video.id}
                                  {video.publishedAt
                                    ? ` · ${new Date(video.publishedAt).toLocaleDateString('vi-VN')}`
                                    : ''}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 tabular-nums">
                            {videoTime(video.duration)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${video.transcriptStatus === 'READY' ? 'bg-emerald-50 text-emerald-700' : video.transcriptStatus === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}
                            >
                              {video.transcriptStatus === 'READY'
                                ? 'Sẵn sàng'
                                : statusNames[video.transcriptStatus] ||
                                  'Chưa tạo'}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              disabled={busy}
                              className={button}
                              onClick={() =>
                                void mutate(() =>
                                  api.setPodcastVideoVisible(
                                    video.id,
                                    !video.isVisible,
                                  ),
                                )
                              }
                            >
                              {video.isVisible ? (
                                <Eye size={16} />
                              ) : (
                                <EyeOff size={16} />
                              )}
                              {video.isVisible ? 'Đang hiện' : 'Đang ẩn'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!videos.length && (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-10 text-center text-gray-500"
                          >
                            Chưa có video phù hợp. Bấm Lấy thêm video cũ hoặc
                            Thêm bằng URL để bổ sung.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  {channels.length} kênh ·{' '}
                  {channels.reduce(
                    (total, item) => total + item.videos.length,
                    0,
                  )}{' '}
                  video
                </p>
                <button
                  disabled={!configured || busy}
                  className={primary}
                  onClick={() => {
                    setModalError('');
                    setModal('channel');
                  }}
                >
                  <Plus size={16} />
                  Thêm kênh YouTube
                </button>
              </div>
              {loading ? (
                <p role="status" className="py-12 text-center text-gray-500">
                  Đang tải kênh…
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {channels.map((item) => (
                    <section
                      key={item.id}
                      className="rounded-2xl border border-gray-200 bg-white p-5"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.avatarUrl}
                          alt=""
                          className="h-14 w-14 rounded-full bg-gray-100 object-cover"
                        />
                        <div className="min-w-0">
                          <h2
                            className="truncate font-bold text-gray-900"
                            title={item.name}
                          >
                            {item.name}
                          </h2>
                          <p className="mt-1 text-xs text-gray-500">
                            {
                              item.videos.filter((video) => video.isVisible)
                                .length
                            }
                            /{item.videos.length} video đang hiển thị
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-gray-500">
                        Đồng bộ: {date(item.lastSyncedAt)}
                      </p>
                      <div className="mt-5 flex flex-wrap justify-between gap-2">
                        <button
                          disabled={busy}
                          className={button}
                          onClick={() =>
                            void mutate(() =>
                              api.setPodcastChannelVisible(
                                item.id,
                                !item.isVisible,
                              ),
                            )
                          }
                        >
                          {item.isVisible ? (
                            <Eye size={15} />
                          ) : (
                            <EyeOff size={15} />
                          )}
                          {item.isVisible ? 'Đang hiện' : 'Đang ẩn'}
                        </button>
                        <button
                          className={primary}
                          onClick={() => {
                            setChannelId(item.id);
                            setQuery('');
                            setVisibility('all');
                          }}
                        >
                          Quản lý video
                        </button>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
      {modal === 'channel' && (
        <PodcastAdminDialog
          title="Thêm kênh YouTube"
          onClose={close}
          busy={busy}
        >
          <form onSubmit={(event) => void addChannel(event)}>
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor="podcast-channel-url"
            >
              URL kênh hoặc @handle
            </label>
            <input
              id="podcast-channel-url"
              required
              maxLength={500}
              value={channelUrl}
              onChange={(event) => setChannelUrl(event.target.value)}
              placeholder="https://www.youtube.com/@tenkenh"
              className={field}
            />
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Thông tin kênh được lấy từ YouTube. Sau khi thêm kênh, bạn có thể
              chọn các video muốn hiển thị.
            </p>
            {modalError && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {modalError}
              </p>
            )}
            <button
              disabled={busy || !channelUrl.trim()}
              className={`${primary} mt-5`}
            >
              {busy ? 'Đang thêm…' : 'Thêm kênh'}
            </button>
          </form>
        </PodcastAdminDialog>
      )}
      {modal === 'import' && (
        <PodcastAdminDialog
          title={
            job
              ? 'Kết quả lấy video'
              : mode === 'URL'
                ? 'Thêm video bằng URL'
                : mode === 'NEWER'
                  ? 'Cập nhật video mới'
                  : 'Lấy thêm video cũ'
          }
          onClose={close}
          busy={busy}
        >
          {!job ? (
            <form onSubmit={(event) => void startImport(event)}>
              {mode === 'URL' ? (
                <label className="block text-sm font-semibold">
                  URL video YouTube
                  <input
                    required
                    maxLength={500}
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    className={`${field} mt-2`}
                    placeholder="https://www.youtube.com/watch?v=…"
                  />
                </label>
              ) : (
                <label className="block text-sm font-semibold">
                  Số video muốn thêm
                  <input
                    required
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    value={count}
                    onChange={(event) => setCount(event.target.value)}
                    className={`${field} mt-2`}
                  />
                </label>
              )}
              <p className="mt-3 text-sm leading-6 text-gray-500">
                {mode === 'OLDER'
                  ? 'Tìm các video cũ chưa có trong thư viện. Ví dụ: đang có 20 video, nhập 30 để bổ sung tối đa 30 video nữa.'
                  : mode === 'NEWER'
                    ? 'Tìm video mới được kênh đăng, trước những video đã có trong thư viện.'
                    : 'Video phải thuộc kênh đang chọn, công khai và cho phép phát trong website.'}{' '}
                Bạn sẽ được xem trước và chọn video trước khi thêm.
              </p>
              <button
                disabled={
                  busy ||
                  (mode !== 'URL' &&
                    (!Number.isInteger(Number(count)) ||
                      Number(count) < 1 ||
                      Number(count) > 100))
                }
                className={`${primary} mt-5`}
              >
                {busy ? 'Đang gửi…' : 'Tìm video'}
              </button>
            </form>
          ) : (
            <>
              {['QUEUED', 'RUNNING'].includes(job.status) && (
                <div
                  role="status"
                  className="rounded-xl bg-indigo-50 p-5 text-sm leading-6 text-indigo-800"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <RefreshCw size={17} className="animate-spin" />
                    {statusNames[job.status]} · Đã kiểm tra {job.scannedCount}{' '}
                    video
                  </p>
                  <p className="mt-2">
                    Bạn có thể đóng hộp thoại. Phiên nhập vẫn tiếp tục và có thể
                    mở lại trong Các phiên nhập gần đây.
                  </p>
                </div>
              )}
              {job.status === 'FAILED' && (
                <div>
                  <p role="alert" className="text-sm text-red-600">
                    {job.errorMessage}
                  </p>
                  <button
                    className={`${button} mt-4`}
                    onClick={() => {
                      setJob(null);
                      setModalError('');
                    }}
                  >
                    Thử lại
                  </button>
                </div>
              )}
              {job.status === 'IMPORTED' && (
                <p
                  role="status"
                  className="rounded-xl bg-emerald-50 p-4 text-emerald-800"
                >
                  Phiên này đã thêm {job.importedCount} video. Không nhập lại
                  các video trùng.
                </p>
              )}
              {job.status === 'READY' && (
                <>
                  <p className="mb-4 text-sm text-gray-500">
                    Tìm được {job.candidates.length}/{job.requestedCount} video
                    có thể thêm.{' '}
                    {job.candidates.length < job.requestedCount
                      ? 'Kênh có thể không còn đủ video phù hợp chưa được nhập.'
                      : 'Chọn các video bạn muốn hiển thị.'}
                  </p>
                  {!!job.candidates.length && (
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={selected.length === job.candidates.length}
                        onChange={(event) =>
                          setSelected(
                            event.target.checked
                              ? job.candidates.map((video) => video.id)
                              : [],
                          )
                        }
                      />
                      Chọn tất cả
                    </label>
                  )}
                  <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                    {job.candidates.map((video) => (
                      <label
                        key={video.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          aria-label={`Chọn: ${video.title}`}
                          checked={selected.includes(video.id)}
                          onChange={(event) =>
                            setSelected((current) =>
                              event.target.checked
                                ? [...current, video.id]
                                : current.filter((id) => id !== video.id),
                            )
                          }
                        />
                        <img
                          src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
                          alt=""
                          className="aspect-video w-24 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                            {video.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {videoTime(video.duration)}
                            {video.publishedAt
                              ? ` · ${new Date(video.publishedAt).toLocaleDateString('vi-VN')}`
                              : ''}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">
                      Phụ đề sẽ được chuẩn bị khi người dùng mở bài học.
                    </p>
                    <button
                      disabled={busy || !selected.length}
                      onClick={() => void commit()}
                      className={primary}
                    >
                      {busy
                        ? 'Đang thêm…'
                        : `Thêm và hiển thị ${selected.length} video`}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
          {modalError && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {modalError}
            </p>
          )}
        </PodcastAdminDialog>
      )}
    </AdminLayout>
  );
}
