jest.mock('../../client/src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StrictMode } from 'react';
import AppDataPrefetch from '../../client/src/components/AppDataPrefetch';
import MyVideosPage from '../../client/src/pages/MyVideosPage';
import VocabularyPage from '../../client/src/pages/VocabularyPage';
import { api, removeToken, setToken } from '../../client/src/lib/api';
import {
  clearAuthenticatedPrefetch,
  prefetchAppFeatures,
} from '../../client/src/lib/prefetchFeatures';
import {
  invalidateCacheByPrefix,
  peekCache,
} from '../../client/src/lib/prefetchCache';
import { PageDataKeys } from '../../client/src/lib/pageDataCache';
import * as auth from '../../client/src/contexts/AuthContext';

const useAuth = jest.mocked(auth.useAuth);
let requests: Array<{ path: string; method: string }>;
const library = {
  words: [],
  stats: { total: 2, due: 1, mastered: 1 },
  sources: [],
};
const quota = {
  used: 1,
  limit: 5,
  remaining: 4,
  isPremium: false,
  resetsAt: '',
  maxSeconds: 100,
};
const list = { jobs: [], quota };
const reply = (value: unknown) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: async () => value,
});
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

beforeEach(() => {
  localStorage.clear();
  removeToken();
  invalidateCacheByPrefix('');
  requests = [];
  global.fetch = jest.fn(async (url, options) => {
    const path = String(url).replace('/api', '').split('?')[0];
    requests.push({ path, method: options?.method ?? 'GET' });
    return reply(
      path === '/vocabulary/saved'
        ? library
        : path === '/video-translate/jobs'
          ? list
          : path === '/video-translate/quota'
            ? quota
            : path === '/packages' || path === '/podcasts/catalog'
              ? []
              : {},
    );
  }) as jest.Mock;
  useAuth.mockReturnValue({ user: null, loading: false } as ReturnType<
    typeof auth.useAuth
  >);
});
afterEach(() => {
  cleanup();
  clearAuthenticatedPrefetch();
  jest.restoreAllMocks();
});

it('starts on a direct vocabulary URL without blocking render or duplicating StrictMode requests', async () => {
  render(
    <StrictMode>
      <MemoryRouter initialEntries={['/tu-vung']}>
        <AppDataPrefetch />
        <p>Trang hiện tại</p>
      </MemoryRouter>
    </StrictMode>,
  );
  expect(screen.getByText('Trang hiện tại')).toBeTruthy();
  await flush();
  for (const path of [
    '/packages',
    '/lessons/access',
    '/podcasts/access',
    '/podcasts/catalog',
    '/video-translate/jobs',
    '/video-translate/quota',
  ]) {
    expect(requests.filter((item) => item.path === path)).toHaveLength(1);
  }
  expect(requests.every((item) => item.method === 'GET')).toBe(true);
  expect(requests.some((item) => item.path === '/vocabulary/saved')).toBe(
    false,
  );
});

it('waits for authentication before loading private data, then pages reuse it', async () => {
  useAuth.mockReturnValue({ user: null, loading: true } as ReturnType<
    typeof auth.useAuth
  >);
  const view = render(<AppDataPrefetch />);
  await flush();
  expect(requests).toHaveLength(4);
  setToken('account-a');
  useAuth.mockReturnValue({ user: { id: 'a' }, loading: false } as ReturnType<
    typeof auth.useAuth
  >);
  view.rerender(<AppDataPrefetch />);
  await flush();
  expect(peekCache(PageDataKeys.savedVocabulary())).toEqual(library);
  await api.getSavedVocabulary({ search: '', status: 'all' });
  await api.listVideoTranslateJobs();
  await api.getVideoTranslateQuota();
  expect(
    requests.filter((item) => item.path === '/vocabulary/saved'),
  ).toHaveLength(1);
  expect(
    requests.filter((item) => item.path === '/video-translate/jobs'),
  ).toHaveLength(1);
});

it('isolates failures so one unavailable endpoint does not block the others', async () => {
  setToken('account-a');
  const original = global.fetch;
  global.fetch = jest.fn((url, options) =>
    String(url).includes('/vocabulary/saved')
      ? Promise.reject(new Error('offline'))
      : original(url, options),
  );
  const result = await prefetchAppFeatures(true);
  expect(result.filter((item) => item.status === 'rejected')).toHaveLength(1);
  expect(peekCache(PageDataKeys.videoJobs)).toEqual(list);
});

it('does not let a previous account restore its late response after logout', async () => {
  setToken('account-a');
  let finish!: (value: unknown) => void;
  const original = global.fetch;
  global.fetch = jest.fn((url, options) =>
    String(url).includes('/vocabulary/saved')
      ? new Promise((resolve) => {
          finish = resolve;
        })
      : original(url, options),
  ) as jest.Mock;
  const old = api.getSavedVocabulary();
  removeToken();
  finish(reply(library));
  await old;
  expect(peekCache(PageDataKeys.savedVocabulary())).toBeUndefined();
  setToken('account-b');
  global.fetch = original;
  await api.getSavedVocabulary();
  expect(
    requests.filter((item) => item.path === '/vocabulary/saved'),
  ).toHaveLength(1);
});

it.each(['vocabulary', 'videos'] as const)(
  'shows the warmed %s page without an initial loading state or another GET',
  async (page) => {
    setToken('account-a');
    useAuth.mockReturnValue({ user: { id: 'a' }, loading: false } as ReturnType<
      typeof auth.useAuth
    >);
    await prefetchAppFeatures(true);
    const count = requests.length;
    const view = render(
      <MemoryRouter>
        {page === 'vocabulary' ? <VocabularyPage /> : <MyVideosPage />}
      </MemoryRouter>,
    );
    expect(view.container.querySelector('.animate-spin')).toBeNull();
    expect(screen.queryByText('Đang tải từ đã lưu…')).toBeNull();
    if (page === 'vocabulary')
      expect(
        screen.getByRole('heading', { name: 'Từ vựng', exact: true }),
      ).toBeTruthy();
    else expect(screen.getByText('Chưa có nội dung nào')).toBeTruthy();
    await flush();
    expect(requests).toHaveLength(count);
  },
);

it.each(['save', 'review', 'remove'] as const)(
  'invalidates vocabulary filters after %s',
  async (action) => {
    setToken('account-a');
    await api.getSavedVocabulary();
    await api.getSavedVocabulary({ status: 'mastered' });
    if (action === 'save')
      await api.saveVocabularyWord({ word: 'new' } as Parameters<
        typeof api.saveVocabularyWord
      >[0]);
    else if (action === 'review')
      await api.reviewSavedVocabulary('word', {
        correct: true,
        requestId: 'r',
        expectedReviewCount: 0,
      });
    else await api.removeSavedVocabulary('word');
    expect(peekCache(PageDataKeys.savedVocabulary())).toBeUndefined();
    expect(
      peekCache(PageDataKeys.savedVocabulary({ status: 'mastered' })),
    ).toBeUndefined();
    await api.getSavedVocabulary();
    expect(
      requests.filter(
        (item) => item.path === '/vocabulary/saved' && item.method === 'GET',
      ),
    ).toHaveLength(3);
  },
);

it.each(['create', 'upload', 'delete'] as const)(
  'invalidates video list and quota after %s',
  async (action) => {
    await api.listVideoTranslateJobs();
    await api.getVideoTranslateQuota();
    if (action === 'create')
      await api.createVideoTranslateJob('https://youtube.com/watch?v=test');
    else if (action === 'upload')
      await api.createVideoTranslateJobFromUpload(
        new File(['test'], 'test.mp3'),
      );
    else await api.deleteVideoTranslateJob('video');
    expect(peekCache(PageDataKeys.videoJobs)).toBeUndefined();
    expect(peekCache(PageDataKeys.videoQuota)).toBeUndefined();
  },
);
