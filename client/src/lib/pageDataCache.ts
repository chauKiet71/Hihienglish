import { invalidateCacheByPrefix } from './prefetchCache';

export const PageDataKeys = {
  lessonAccess: 'page-data:lesson-access',
  videoJobs: 'page-data:video-jobs',
  videoQuota: 'page-data:video-quota',
  savedVocabulary: (params: Record<string, string | undefined> = {}) => {
    const normalized = { status: 'all', search: '', ...params };
    const query = Object.entries(normalized)
      .filter(([, value]) => value !== undefined && value !== '')
      .sort(([a], [b]) => a.localeCompare(b));
    return `page-data:saved-vocabulary:${new URLSearchParams(query as string[][])}`;
  },
} as const;

export function clearPageDataCache() {
  invalidateCacheByPrefix('page-data:');
}

/** A caller can stop waiting without cancelling a shared background request. */
export function withAbortSignal<T>(
  promise: Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    void promise.catch(() => {});
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort));
  });
}
