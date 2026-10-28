import { api } from './api';
import { clearPageDataCache } from './pageDataCache';
import {
  cachedFetch,
  invalidateCache,
  invalidateCacheByPrefix,
} from './prefetchCache';

export const PrefetchKeys = {
  lessonStats: 'lesson-stats',
  vocabularyOverview: 'vocabulary-overview',
  vocabularySet: (id: string) => `vocabulary-set:${id}`,
  speakingScenarios: 'speaking-scenarios',
  speakingQuota: 'speaking-quota',
  speakingHistory: 'speaking-history',
  packages: 'packages-active',
} as const;

const DEFAULT_TTL = 5 * 60 * 1000;

export function fetchLessonStats(force = false) {
  return cachedFetch(PrefetchKeys.lessonStats, () => api.getMyLessonStats(), {
    ttlMs: DEFAULT_TTL,
    force,
  });
}

export function fetchVocabularyOverview(force = false) {
  return cachedFetch(
    PrefetchKeys.vocabularyOverview,
    () => api.getVocabularyOverview(),
    { ttlMs: DEFAULT_TTL, force },
  );
}

export function fetchVocabularySet(id: string, force = false) {
  return cachedFetch(
    PrefetchKeys.vocabularySet(id),
    () => api.getVocabularySet(id),
    // Giữ cache lâu để quay lại chủ đề không phải fetch lại.
    { ttlMs: 24 * 60 * 60 * 1000, force },
  );
}

export function fetchActivePackages(force = false) {
  return cachedFetch(
    PrefetchKeys.packages,
    () => api.getPackages({ status: 'ACTIVE', visible: true }),
    { ttlMs: DEFAULT_TTL, force },
  );
}

export function fetchSpeakingScenarios(force = false) {
  return cachedFetch(
    PrefetchKeys.speakingScenarios,
    () => api.getSpeakingScenarios(),
    { ttlMs: DEFAULT_TTL, force },
  );
}

export function fetchSpeakingQuota(force = false) {
  return cachedFetch(PrefetchKeys.speakingQuota, () => api.getSpeakingQuota(), {
    ttlMs: DEFAULT_TTL,
    force,
  });
}

export function fetchSpeakingHistory(force = false) {
  return cachedFetch(
    PrefetchKeys.speakingHistory,
    () => api.getSpeakingHistory(),
    { ttlMs: 30 * 1000, force },
  );
}

/** Read-only data for the main routes, independent of the entry URL. */
export function prefetchAppFeatures(
  isAuthenticated: boolean,
  authReady = true,
  priority?: { pathname: string; critical: boolean },
) {
  if (priority?.critical) {
    const path = priority.pathname;
    if (path === '/')
      return Promise.allSettled([
        api.getPodcastCatalog(),
        api.getLessonAccessMap(),
      ]);
    if (
      path.startsWith('/podcast') ||
      path.startsWith('/postcast') ||
      path.startsWith('/kenh')
    )
      return Promise.allSettled([
        api.getPodcastCatalog(),
        api.getPodcastAccessMap(),
      ]);
    if (path.startsWith('/kham-pha') || path.startsWith('/bai-hoc'))
      return Promise.allSettled([api.getLessonAccessMap()]);
    if (path.startsWith('/tu-vung'))
      return Promise.allSettled(
        authReady && isAuthenticated ? [api.getSavedVocabulary()] : [],
      );
    if (path.startsWith('/video-cua-toi') || path.startsWith('/dich-video'))
      return Promise.allSettled(
        authReady
          ? [api.listVideoTranslateJobs(), api.getVideoTranslateQuota()]
          : [],
      );
    if (path.startsWith('/nang-cap'))
      return Promise.allSettled([fetchActivePackages()]);
    if (path.startsWith('/ca-nhan'))
      return Promise.allSettled(
        authReady && isAuthenticated ? [fetchLessonStats()] : [],
      );
    return Promise.allSettled([]);
  }
  const tasks: Promise<unknown>[] = [
    fetchActivePackages(),
    api.getLessonAccessMap(),
    api.getPodcastAccessMap(),
    api.getPodcastCatalog(),
  ];

  if (authReady)
    tasks.push(api.listVideoTranslateJobs(), api.getVideoTranslateQuota());

  if (authReady && isAuthenticated) {
    tasks.push(fetchLessonStats(), api.getSavedVocabulary());
  }

  return Promise.allSettled(tasks);
}

export function clearAuthenticatedPrefetch() {
  clearPageDataCache();
  invalidateCache([
    PrefetchKeys.lessonStats,
    PrefetchKeys.vocabularyOverview,
    PrefetchKeys.speakingScenarios,
    PrefetchKeys.speakingQuota,
    PrefetchKeys.speakingHistory,
  ]);
  invalidateCacheByPrefix('vocabulary-set:');
}
