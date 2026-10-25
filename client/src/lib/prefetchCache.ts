type CacheEntry<T> = {
  promise: Promise<T>;
  data?: T;
  at: number;
  ttlMs: number;
  pending: boolean;
};

const store = new Map<string, CacheEntry<unknown>>();

export function peekCache<T>(key: string): T | undefined {
  const entry = store.get(key);
  return entry && Date.now() - entry.at < entry.ttlMs
    ? (entry.data as T | undefined)
    : undefined;
}

export function setCache<T>(key: string, data: T) {
  const promise = Promise.resolve(data);
  store.set(key, {
    promise,
    data,
    at: Date.now(),
    ttlMs: store.get(key)?.ttlMs ?? 5 * 60 * 1000,
    pending: false,
  });
}

export function invalidateCache(key: string | string[]) {
  const keys = Array.isArray(key) ? key : [key];
  for (const item of keys) {
    store.delete(item);
  }
}

export function invalidateCacheByPrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

/** Deduplicated fetch with optional TTL. In-flight requests share one promise. */
export function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttlMs?: number; force?: boolean },
): Promise<T> {
  const ttlMs = options?.ttlMs ?? 5 * 60 * 1000;
  const existing = store.get(key) as CacheEntry<T> | undefined;

  if (existing?.pending) return existing.promise;
  if (!options?.force && existing) {
    if (existing.data !== undefined && Date.now() - existing.at < ttlMs) {
      return Promise.resolve(existing.data);
    }
  }

  let request: Promise<T>;
  try {
    request = fetcher();
  } catch (error) {
    return Promise.reject(error);
  }
  const promise = request
    .then((data) => {
      // Invalidated requests may finish after a mutation or an account switch.
      // They must never restore an entry removed/replaced in the meantime.
      if (store.get(key)?.promise === promise) {
        store.set(key, {
          promise,
          data,
          at: Date.now(),
          ttlMs,
          pending: false,
        });
      }
      return data;
    })
    .catch((error) => {
      const current = store.get(key);
      if (current?.promise === promise) {
        store.delete(key);
      }
      throw error;
    });

  store.set(key, {
    promise,
    at: existing?.at ?? Date.now(),
    ttlMs,
    pending: true,
    data: existing?.data,
  });
  return promise;
}
