import { readJson, writeJson } from "./store";

export interface AppSettings {
  steamApiKey?: string;
  steamId?: string;
  psnNpsso?: string;
  psnNpssoSavedAt?: string;
  gogAccessToken?: string;
  gogRefreshToken?: string;
  gogUserId?: string;
  publicProfile?: boolean;
  publicHandle?: string;
}

export async function readSettings(userId: string): Promise<AppSettings> {
  return readJson<AppSettings>("settings", userId, {});
}

export async function writeSettings(
  userId: string,
  settings: AppSettings
): Promise<void> {
  return writeJson("settings", userId, settings);
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
    psnNpssoSavedAt: settings.psnNpssoSavedAt ?? "",
    hasSteam: Boolean(settings.steamId),
    hasPsn: Boolean(settings.psnNpsso),
    hasGog: Boolean(settings.gogAccessToken),
    publicProfile: Boolean(settings.publicProfile),
    publicHandle: settings.publicHandle ?? "",
  };
}
