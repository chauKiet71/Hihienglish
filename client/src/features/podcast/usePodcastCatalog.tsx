import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { peekCache } from '../../lib/prefetchCache';
import { PageDataKeys } from '../../lib/pageDataCache';
import type { CatalogChannel } from '../../../../src/podcast/catalog.types';

export function usePodcastCatalog() {
  const [channels, setChannels] = useState<CatalogChannel[]>(
    () => peekCache<CatalogChannel[]>(PageDataKeys.podcastCatalog) ?? [],
  );
  const [loading, setLoading] = useState(
    !peekCache(PageDataKeys.podcastCatalog),
  );
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    let sequence = 0;
    const load = () => {
      const request = ++sequence;
      void api
        .getPodcastCatalog()
        .then((data) => {
          if (active && request === sequence) {
            setChannels(data);
            setError('');
            setLoading(false);
          }
        })
        .catch((reason: unknown) => {
          if (active && request === sequence) {
            setError(
              reason instanceof Error
                ? reason.message
                : 'Chưa tải được danh sách Podcast.',
            );
            setLoading(false);
          }
        });
    };
    load();
    const refresh = () => {
      if (document.visibilityState !== 'hidden') load();
    };
    window.addEventListener('podcast-catalog-changed', load);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('podcast-catalog-changed', load);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [attempt]);
  const videos = useMemo(
    () => channels.flatMap((channel) => channel.videos),
    [channels],
  );
  return { channels, videos, loading, error, retry };
}

export function CatalogFeedback({
  catalog,
}: {
  catalog: ReturnType<typeof usePodcastCatalog>;
}) {
  if (catalog.loading)
    return (
      <p role="status" className="p-5 text-center text-sm text-slate-500">
        Đang tải Podcast…
      </p>
    );
  if (!catalog.error) return null;
  return (
    <div
      role="alert"
      className="m-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
    >
      <p>{catalog.error}</p>
      <button onClick={catalog.retry} className="mt-2 font-semibold underline">
        Thử lại
      </button>
    </div>
  );
}
