import { useCallback, useEffect, useMemo, useState } from 'react';
import { Crown, RefreshCw, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import AdminContentTabs from '../../components/AdminContentTabs';
import { PUBLIC_VIDEOS } from '../../../../src/catalog/public-videos';
import { api } from '../../lib/api';
import type { PodcastPolicy } from '../../lib/podcastAccess';
import { PageDataKeys } from '../../lib/pageDataCache';
import { peekCache, setCache } from '../../lib/prefetchCache';
import { videoTime } from '../../features/youtube/catalog';

type Draft = { isPremium: boolean; previewSeconds: string };
const channels = [...new Set(PUBLIC_VIDEOS.map((video) => video.channelName))];

export default function AdminPodcastsPage() {
  const [policies, setPolicies] = useState(
    () =>
      peekCache<Record<string, PodcastPolicy>>(PageDataKeys.podcastAccess) ??
      {},
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(
    !peekCache(PageDataKeys.podcastAccess),
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [available, setAvailable] = useState(
    !!peekCache(PageDataKeys.podcastAccess),
  );
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState('all');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError('');
    try {
      setPolicies(await api.getPodcastAccessMap(force));
      setAvailable(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không tải được cài đặt podcast.',
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      PUBLIC_VIDEOS.filter((video) => {
        if (channel !== 'all' && video.channelName !== channel) return false;
        const locked = policies[video.id]?.isPremium ?? false;
        if ((filter === 'premium' && !locked) || (filter === 'free' && locked))
          return false;
        return `${video.title} ${video.id} ${video.channelName}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      }),
    [policies, query, channel, filter],
  );
  const premiumCount = PUBLIC_VIDEOS.filter(
    (video) => policies[video.id]?.isPremium,
  ).length;

  async function save(videoId: string, draft: Draft) {
    setSaving(videoId);
    setError('');
    setNotice('');
    try {
      const result = await api.setPodcastAccess(videoId, {
        isPremium: draft.isPremium,
        previewSeconds: Number(draft.previewSeconds),
      });
      const next = { ...policies, [videoId]: result };
      setPolicies(next);
      setCache(PageDataKeys.podcastAccess, next);
      setDrafts((current) => {
        const nextDrafts = { ...current };
        delete nextDrafts[videoId];
        return nextDrafts;
      });
      setNotice('Đã lưu cài đặt Premium cho podcast.');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không lưu được cài đặt podcast.',
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <AdminLayout
      title="Khóa Premium podcast"
      subtitle="Đặt thời gian nghe thử cho từng video. Người dùng Free phải nâng cấp Premium để nghe tiếp sau giới hạn."
    >
      <AdminContentTabs />
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          [PUBLIC_VIDEOS.length, 'Tổng podcast'],
          [premiumCount, 'Podcast Premium'],
          [PUBLIC_VIDEOS.length - premiumCount, 'Podcast miễn phí'],
        ].map(([count, label]) => (
          <div
            key={label}
            className="rounded-xl border border-gray-100 bg-white p-4"
          >
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="mt-1 text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-gray-100 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <div className="relative min-w-52 flex-1">
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={17}
            />
            <input
              aria-label="Tìm podcast"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm video, mã video hoặc kênh…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <select
            aria-label="Kênh podcast"
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm"
          >
            <option value="all">Tất cả kênh</option>
            {channels.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <select
            aria-label="Trạng thái Premium"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="premium">Premium</option>
            <option value="free">Miễn phí</option>
          </select>
          <button
            type="button"
            disabled={loading || !!saving}
            onClick={() => void load(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 p-2 text-sm disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Tải lại
          </button>
        </div>
        <p className="px-4 py-3 text-xs leading-5 text-gray-500">
          Thời gian nghe thử tính bằng giây: 120 giây = 02:00. Đặt 0 để yêu cầu
          Premium ngay khi mở. Bật/tắt Premium hoặc đổi thời gian rồi bấm Lưu.
        </p>
        {error && (
          <div
            role="alert"
            className="mx-4 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        {notice && (
          <p
            role="status"
            className="mx-4 mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            {notice}
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3">Podcast</th>
                <th className="px-4 py-3">Kênh</th>
                <th className="px-4 py-3">Thời lượng</th>
                <th className="px-4 py-3">Premium</th>
                <th className="px-4 py-3">Nghe thử (giây)</th>
                <th className="px-4 py-3">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400">
                    Đang tải cài đặt podcast…
                  </td>
                </tr>
              ) : !available ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400">
                    Chưa tải được cài đặt. Bấm Tải lại để thử lại.
                  </td>
                </tr>
              ) : !filtered.length ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-400">
                    Không có podcast phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((video) => {
                  const saved = policies[video.id] ?? {
                    videoId: video.id,
                    isPremium: false,
                    previewSeconds: Math.min(120, video.duration - 1),
                  };
                  const draft = drafts[video.id] ?? {
                    isPremium: saved.isPremium,
                    previewSeconds: String(saved.previewSeconds),
                  };
                  const seconds = Number(draft.previewSeconds);
                  const invalid =
                    !draft.previewSeconds.trim() ||
                    !Number.isInteger(seconds) ||
                    seconds < 0 ||
                    seconds >= video.duration;
                  const changed =
                    draft.isPremium !== saved.isPremium ||
                    seconds !== saved.previewSeconds;
                  const patch = (next: Partial<Draft>) =>
                    setDrafts((current) => ({
                      ...current,
                      [video.id]: { ...draft, ...next },
                    }));
                  return (
                    <tr
                      key={video.id}
                      className="border-b border-gray-50 align-top hover:bg-gray-50/50"
                    >
                      <td className="max-w-96 px-4 py-4">
                        <a
                          href={video.lessonPath}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-gray-900 hover:text-primary"
                        >
                          {video.title}
                        </a>
                        <p className="mt-1 text-xs text-gray-400">{video.id}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {video.channelName}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-gray-600">
                        {videoTime(video.duration)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          role="switch"
                          type="button"
                          aria-label={`Premium: ${video.title}`}
                          aria-checked={draft.isPremium}
                          disabled={!!saving || !available}
                          onClick={() => patch({ isPremium: !draft.isPremium })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full disabled:opacity-50 ${draft.isPremium ? 'bg-primary' : 'bg-gray-300'}`}
                        >
                          <span
                            className={`h-4 w-4 rounded-full bg-white transition-transform ${draft.isPremium ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                        <span className="mt-2 flex items-center gap-1 whitespace-nowrap text-xs text-gray-500">
                          {draft.isPremium && <Crown size={12} />}
                          {draft.isPremium ? 'Premium' : 'Miễn phí'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="number"
                          min={0}
                          max={video.duration - 1}
                          step={1}
                          aria-label={`Thời gian nghe thử: ${video.title}`}
                          value={draft.previewSeconds}
                          disabled={!!saving || !available}
                          onChange={(event) =>
                            patch({ previewSeconds: event.target.value })
                          }
                          className="w-24 rounded-lg border border-gray-200 px-3 py-2 tabular-nums disabled:opacity-50"
                        />
                        <p
                          className={`mt-1 text-xs ${invalid ? 'text-red-600' : 'text-gray-400'}`}
                        >
                          {invalid
                            ? `Nhập từ 0 đến ${video.duration - 1} giây`
                            : videoTime(seconds)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          aria-label={`Lưu cài đặt: ${video.title}`}
                          disabled={
                            !changed || invalid || !!saving || !available
                          }
                          onClick={() => void save(video.id, draft)}
                          className="rounded-lg bg-primary px-4 py-2 font-semibold text-white disabled:opacity-40"
                        >
                          {saving === video.id ? 'Đang lưu…' : 'Lưu'}
                        </button>
                        {changed && (
                          <p className="mt-1 text-xs text-amber-600">
                            Chưa lưu
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}
