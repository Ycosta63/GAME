interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = store.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value;
  }
  const value = await fetcher();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidate(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}
