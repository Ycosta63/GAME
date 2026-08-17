import { cached } from "./cache";
import type { AchievementSummary, RawGame } from "@/types/game";

const BASE = "https://api.steampowered.com";

interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number;
  rtime_last_played?: number;
}

interface SteamOwnedGamesResponse {
  response: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
}

export class SteamError extends Error {}

async function steamFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new SteamError(`Steam API a répondu ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Resolves a Steam vanity URL (custom profile name) to a 64-bit SteamID. */
export async function resolveSteamId(
  apiKey: string,
  vanityOrId: string
): Promise<string> {
  if (/^\d{17}$/.test(vanityOrId)) {
    return vanityOrId;
  }
  const url = `${BASE}/ISteamUser/ResolveVanityURL/v0001/?key=${encodeURIComponent(
    apiKey
  )}&vanityurl=${encodeURIComponent(vanityOrId)}`;
  const data = await steamFetch<{
    response: { success: number; steamid?: string; message?: string };
  }>(url);
  if (data.response.success !== 1 || !data.response.steamid) {
    throw new SteamError(
      data.response.message ?? "Impossible de résoudre ce SteamID"
    );
  }
  return data.response.steamid;
}

export async function fetchOwnedGames(
  apiKey: string,
  steamId: string
): Promise<RawGame[]> {
  const cacheKey = `steam:owned:${steamId}`;
  return cached(cacheKey, 5 * 60 * 1000, async () => {
    const url = `${BASE}/IPlayerService/GetOwnedGames/v0001/?key=${encodeURIComponent(
      apiKey
    )}&steamid=${encodeURIComponent(
      steamId
    )}&include_appinfo=true&include_played_free_games=true&format=json`;
    const data = await steamFetch<SteamOwnedGamesResponse>(url);
    const games = data.response.games ?? [];
    return games.map((g) => ({
      platform: "steam" as const,
      id: String(g.appid),
      name: g.name,
      playtimeMinutes: g.playtime_forever,
      // Portrait "library capsule" art Valve serves for the store/library UI —
      // a poster-shaped cover, not the tiny 32x32 icon. Not every app has
      // one (older titles); the client falls back to the landscape header
      // image, then to a text placeholder.
      coverUrl: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`,
      lastPlayed: g.rtime_last_played
        ? new Date(g.rtime_last_played * 1000).toISOString()
        : null,
    }));
  });
}

/** Fetches unlock progress for a single game's achievements. Not all games have achievements. */
export async function fetchAchievementSummary(
  apiKey: string,
  steamId: string,
  appId: string
): Promise<AchievementSummary | null> {
  const cacheKey = `steam:ach:${steamId}:${appId}`;
  return cached(cacheKey, 30 * 60 * 1000, async () => {
    const url = `${BASE}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${encodeURIComponent(
      appId
    )}&key=${encodeURIComponent(apiKey)}&steamid=${encodeURIComponent(
      steamId
    )}&format=json`;
    try {
      const data = await steamFetch<{
        playerstats: {
          success: boolean;
          achievements?: { achieved: number }[];
        };
      }>(url);
      const list = data.playerstats.achievements;
      if (!data.playerstats.success || !list || list.length === 0) {
        return null;
      }
      const unlocked = list.filter((a) => a.achieved === 1).length;
      return {
        total: list.length,
        unlocked,
        progressPercent: Math.round((unlocked / list.length) * 100),
      };
    } catch {
      return null;
    }
  });
}
