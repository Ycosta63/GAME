import fs from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";

export interface AppSettings {
  steamApiKey?: string;
  steamId?: string;
  psnNpsso?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const REDIS_KEY = "game-library-hub:settings";

// On a serverless host (Vercel) the local filesystem is read-only /
// ephemeral, so settings need a real persistence layer there. Locally
// (npm run dev / self-hosted with a real disk) the JSON file keeps
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

function readSettingsFromFile(): AppSettings {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return JSON.parse(raw) as AppSettings;
  } catch {
    return {};
  }
}

function writeSettingsToFile(settings: AppSettings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

export async function readSettings(): Promise<AppSettings> {
  if (redis) {
    const value = await redis.get<AppSettings>(REDIS_KEY);
    return value ?? {};
  }
  return readSettingsFromFile();
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  if (redis) {
    await redis.set(REDIS_KEY, settings);
    return;
  }
  writeSettingsToFile(settings);
}

export async function mergeSettings(
  patch: Partial<AppSettings>
): Promise<AppSettings> {
  const current = await readSettings();
  const next = { ...current, ...patch };
  await writeSettings(next);
  return next;
}

export function redactSettings(settings: AppSettings) {
  return {
    steamApiKey: settings.steamApiKey ? "••••••••" : "",
    steamId: settings.steamId ?? "",
    psnNpsso: settings.psnNpsso ? "••••••••" : "",
    hasSteam: Boolean(settings.steamApiKey && settings.steamId),
    hasPsn: Boolean(settings.psnNpsso),
  };
}
