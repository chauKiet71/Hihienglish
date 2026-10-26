import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
  PODCAST_ACCESS_CHANGED,
  type PodcastPlaybackAccess,
} from '../../lib/podcastAccess';

export function usePodcastAccess(videoId: string) {
  const { user, loading: authLoading } = useAuth();
  const key = `${videoId}:${user?.id ?? 'guest'}:${user?.isPremium}:${user?.premiumExpiresAt}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    key: string;
    access: PodcastPlaybackAccess | null;
    error: string;
  }>({ key: '', access: null, error: '' });

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    let controller: AbortController | undefined;
    let expiryTimer: number | undefined;
    setState({ key, access: null, error: '' });
    async function load() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      try {
        const access = await api.getPodcastPlaybackAccess(
          videoId,
          request.signal,
        );
        if (cancelled || request.signal.aborted) return;
        if (
          access.videoId !== videoId ||
          typeof access.canListenFull !== 'boolean' ||
          (!access.canListenFull &&
            (!Number.isInteger(access.previewLimitSeconds) ||
              access.previewLimitSeconds! < 0))
        ) {
          throw new Error(
            'Không tải được quyền nghe podcast. Vui lòng thử lại.',
          );
        }
        setState({ key, access, error: '' });
        window.clearTimeout(expiryTimer);
        if (access.premiumExpiresAt) {
          const remaining =
            new Date(access.premiumExpiresAt).getTime() - Date.now();
          expiryTimer = window.setTimeout(
            () => {
              setState({ key, access: null, error: '' });
              void load();
            },
            Math.min(2_147_483_647, Math.max(1, remaining)),
          );
        }
      } catch (reason) {
        if (!cancelled && !request.signal.aborted)
          setState({
            key,
            access: null,
            error:
              reason instanceof Error
                ? reason.message
                : 'Không tải được quyền nghe podcast.',
          });
      }
    }
    const refresh = () => {
      void load();
    };
    const visible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    void load();
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    window.addEventListener(PODCAST_ACCESS_CHANGED, refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      cancelled = true;
      controller?.abort();
      window.clearInterval(interval);
      window.clearTimeout(expiryTimer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener(PODCAST_ACCESS_CHANGED, refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [key, videoId, authLoading, attempt]);

  const current =
    state.key === key && !authLoading ? state : { access: null, error: '' };
  return { ...current, retry: () => setAttempt((value) => value + 1) };
}
