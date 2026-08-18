import { deleteJsonPrefix, hasRedis, readJson, writeJsonWithTtl } from "./store";

interface MemoryEntry<T> {
  value: T;
  expiresAt: number;
}

const NAMESPACE = "cache";
const MISSING = Symbol("cache-miss");
const memoryStore = new Map<string, MemoryEntry<unknown>>();

/**
 * Backed by Redis when configured (survives Vercel's cold starts between
 * serverless invocations), falling back to an in-memory Map otherwise
 * (dev, or no Upstash env vars set — same behavior as before).
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (hasRedis()) {
    const existing = await readJson<T | typeof MISSING>(NAMESPACE, key, MISSING);
    if (existing !== MISSING) {
      return existing;
    }
    const value = await fetcher();
    await writeJsonWithTtl(NAMESPACE, key, value, Math.max(1, Math.round(ttlMs / 1000)));
    return value;
  }

  const existing = memoryStore.get(key) as MemoryEntry<T> | undefined;
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value;
  }
  const value = await fetcher();
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export async function invalidate(prefix: string): Promise<void> {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }
  if (hasRedis()) {
    await deleteJsonPrefix(NAMESPACE, prefix);
  }
}
