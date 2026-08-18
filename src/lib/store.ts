import fs from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

const DATA_DIR = path.join(process.cwd(), "data");
const REDIS_KEY_PREFIX = "game-library-hub:";

// On a serverless host (Vercel) the local filesystem is read-only /
// ephemeral, so persistence needs a real backend there. Locally (npm run
// dev / self-hosted with a real disk) a JSON file per namespace+key keeps
// working with zero setup. Whichever is available is used transparently.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export function hasRedis(): boolean {
  return redis !== null;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(namespace: string, key: string): string {
  return path.join(DATA_DIR, `${namespace}-${encodeURIComponent(key)}.json`);
}

export async function readJson<T>(
  namespace: string,
  key: string,
  fallback: T
): Promise<T> {
  if (redis) {
    const value = await redis.get<T>(`${REDIS_KEY_PREFIX}${namespace}:${key}`);
    return value ?? fallback;
  }
  ensureDataDir();
  const file = filePath(namespace, key);
  if (!fs.existsSync(file)) {
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(
  namespace: string,
  key: string,
  value: T
): Promise<void> {
  if (redis) {
    await redis.set(`${REDIS_KEY_PREFIX}${namespace}:${key}`, value);
    return;
  }
  ensureDataDir();
  fs.writeFileSync(filePath(namespace, key), JSON.stringify(value, null, 2), "utf-8");
}

/** Same as writeJson, but expires automatically after ttlSeconds when Redis
 * is available. On the file backend TTL is ignored (dev-only fallback). */
export async function writeJsonWithTtl<T>(
  namespace: string,
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  if (redis) {
    await redis.set(`${REDIS_KEY_PREFIX}${namespace}:${key}`, value, {
      ex: Math.max(1, Math.round(ttlSeconds)),
    });
    return;
  }
  await writeJson(namespace, key, value);
}

export async function deleteJson(namespace: string, key: string): Promise<void> {
  if (redis) {
    await redis.del(`${REDIS_KEY_PREFIX}${namespace}:${key}`);
    return;
  }
  ensureDataDir();
  const file = filePath(namespace, key);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

/** Atomic set-if-absent — used for claiming a handle so two users racing
 * for the same one can't both "win". Returns true if this call claimed it,
 * false if something was already there. The file backend has no atomic
 * primitive to fall back on (dev-only, single process, not a real race). */
export async function claimJson<T>(
  namespace: string,
  key: string,
  value: T
): Promise<boolean> {
  if (redis) {
    const result = await redis.set(`${REDIS_KEY_PREFIX}${namespace}:${key}`, value, {
      nx: true,
    });
    return result !== null;
  }
  ensureDataDir();
  const file = filePath(namespace, key);
  if (fs.existsSync(file)) {
    return false;
  }
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf-8");
  return true;
}

/** Lists every key currently stored in a namespace (decoded back to the
 * original key, not the storage-encoded form). Used for small, admin-ish
 * enumerations (e.g. every claimed public handle) — not meant for
 * namespaces that could grow into the thousands, since the file backend
 * does a full directory scan and Redis KEYS is O(n) too. */
export async function listJsonKeys(namespace: string): Promise<string[]> {
  if (redis) {
    const prefix = `${REDIS_KEY_PREFIX}${namespace}:`;
    const keys = await redis.keys(`${prefix}*`);
    return keys.map((k) => k.slice(prefix.length));
  }
  ensureDataDir();
  const filePrefix = `${namespace}-`;
  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.startsWith(filePrefix) && f.endsWith(".json"))
    .map((f) => decodeURIComponent(f.slice(filePrefix.length, -".json".length)));
}

export async function deleteJsonPrefix(
  namespace: string,
  keyPrefix: string
): Promise<void> {
  if (redis) {
    const keys = await redis.keys(`${REDIS_KEY_PREFIX}${namespace}:${keyPrefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return;
  }
  ensureDataDir();
  const prefix = `${namespace}-${encodeURIComponent(keyPrefix)}`;
  for (const file of fs.readdirSync(DATA_DIR)) {
    if (file.startsWith(prefix)) {
      fs.unlinkSync(path.join(DATA_DIR, file));
    }
  }
}
