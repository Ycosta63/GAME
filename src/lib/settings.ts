import fs from "node:fs";
import path from "node:path";

export interface AppSettings {
  steamApiKey?: string;
  steamId?: string;
  psnNpsso?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readSettings(): AppSettings {
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

export function writeSettings(settings: AppSettings) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

export function mergeSettings(patch: Partial<AppSettings>): AppSettings {
  const current = readSettings();
  const next = { ...current, ...patch };
  writeSettings(next);
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
