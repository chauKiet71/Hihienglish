import {
  cachedFetch,
  invalidateCache,
  invalidateCacheByPrefix,
  peekCache,
  setCache,
} from '../../client/src/lib/prefetchCache';
import { withAbortSignal } from '../../client/src/lib/pageDataCache';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
afterEach(() => {
  invalidateCacheByPrefix('test:');
  jest.restoreAllMocks();
});

it('shares pending requests including simultaneous forced refreshes', async () => {
  const pending = deferred<number>();
  const fetcher = jest.fn(() => pending.promise);
  const first = cachedFetch('test:key', fetcher);
  expect(cachedFetch('test:key', fetcher, { force: true })).toBe(first);
  pending.resolve(1);
  await expect(first).resolves.toBe(1);
  expect(fetcher).toHaveBeenCalledTimes(1);
});

it('expires cached values and shares a refresh rather than returning stale data', async () => {
  let now = 100;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  await cachedFetch('test:key', async () => 1, { ttlMs: 10 });
  now += 11;
  expect(peekCache('test:key')).toBeUndefined();
  const pending = deferred<number>();
  const first = cachedFetch('test:key', () => pending.promise, { ttlMs: 10 });
  expect(cachedFetch('test:key', async () => 3, { ttlMs: 10 })).toBe(first);
  pending.resolve(2);
  await expect(first).resolves.toBe(2);
  expect(peekCache('test:key')).toBe(2);
});

it('does not restore invalidated data when an old request finishes', async () => {
  const old = deferred<string>();
  const request = cachedFetch('test:user', () => old.promise);
  invalidateCache('test:user');
  await cachedFetch('test:user', async () => 'new account');
  old.resolve('old account');
  await request;
  expect(peekCache('test:user')).toBe('new account');
});

it('does not overwrite newer explicitly cached data', async () => {
  const old = deferred<number>();
  const request = cachedFetch('test:key', () => old.promise);
  setCache('test:key', 2);
  old.resolve(1);
  await request;
  expect(peekCache('test:key')).toBe(2);
});

it('retries failures and isolates unrelated cache entries', async () => {
  setCache('test:other', 4);
  await expect(
    cachedFetch('test:key', async () => {
      throw new Error('offline');
    }),
  ).rejects.toThrow('offline');
  await expect(cachedFetch('test:key', async () => 3)).resolves.toBe(3);
  expect(peekCache('test:other')).toBe(4);
});

it('aborting one caller does not cancel another caller sharing the request', async () => {
  const pending = deferred<number>();
  const controller = new AbortController();
  const shared = cachedFetch('test:key', () => pending.promise);
  const caller = withAbortSignal(shared, controller.signal);
  controller.abort();
  await expect(caller).rejects.toMatchObject({ name: 'AbortError' });
  pending.resolve(3);
  await expect(shared).resolves.toBe(3);
  expect(peekCache('test:key')).toBe(3);
});
