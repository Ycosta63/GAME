import fs from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

export interface AppSettings {
  steamApiKey?: string;
  steamId?: string;
  psnNpsso?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const REDIS_KEY_PREFIX = "game-library-hub:settings:";

// On a serverless host (Vercel) the local filesystem is read-only /
// ephemeral, so settings need a real persistence layer there. Locally
// (npm run dev / self-hosted with a real disk) a JSON file per user keeps
// working with zero setup. Whichever is available is used transparently.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function settingsFilePath(userId: string): string {
  return path.join(DATA_DIR, `settings-${encodeURIComponent(userId)}.json`);
}

function readSettingsFromFile(userId: string): AppSettings {
  ensureDataDir();
  const file = settingsFilePath(userId);
  if (!fs.existsSync(file)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw) as AppSettings;
  } catch {
    return {};
  }
}

function writeSettingsToFile(userId: string, settings: AppSettings) {
  ensureDataDir();
  fs.writeFileSync(
    settingsFilePath(userId),
    JSON.stringify(settings, null, 2),
    "utf-8"
  );
}

export async function readSettings(userId: string): Promise<AppSettings> {
  if (redis) {
    const value = await redis.get<AppSettings>(REDIS_KEY_PREFIX + userId);
    return value ?? {};
  }
  return readSettingsFromFile(userId);
}

export async function writeSettings(
  userId: string,
  settings: AppSettings
): Promise<void> {
  if (redis) {
    await redis.set(REDIS_KEY_PREFIX + userId, settings);
    return;
  }
  writeSettingsToFile(userId, settings);
}

export async function mergeSettings(
  userId: string,
  patch: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await readSettings(userId);
  const next = { ...current, ...patch };
  await writeSettings(userId, next);
  return next;
}

export function redactSettings(settings: AppSettings) {
  return {
    steamApiKey: settings.steamApiKey ? "••••••••" : "",
    steamId: settings.steamId ?? "",
    psnNpsso: settings.psnNpsso ? "••••••••" : "",
    hasSteam: Boolean(settings.steamId),
    hasPsn: Boolean(settings.psnNpsso),
  };
}
