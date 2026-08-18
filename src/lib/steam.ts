import { cached } from "./cache";
import type { AchievementDetails, RawGame } from "@/types/game";

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

/**
 * Steam's Web API rate-limits per key (undocumented, roughly a few hundred
 * requests per 5 minutes) and returns 429 when tripped. A single game's
 * achievement check already does 2-3 calls, and the "100% terminés" filter
 * fires that across a whole library, so retrying a 429 with backoff (instead
 * of surfacing it as a hard error immediately) meaningfully improves
 * reliability for larger libraries.
 */
async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  let res: Response;
  for (let i = 0; i < attempts; i++) {
    res = await fetch(url, { cache: "no-store" });
    if (res.status !== 429) return res;
    if (i < attempts - 1) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const backoffMs = retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** i;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }
  return res!;
}

async function steamFetch<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);
  if (!res.ok) {
    throw new SteamError(
      res.status === 429
        ? "Steam API : trop de requêtes, réessaie dans quelques minutes"
        : `Steam API a répondu ${res.status}`
    );
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

interface SchemaAchievement {
  name: string;
  displayName: string;
  description?: string;
  icon: string;
  icongray: string;
}

/** Static per-game achievement metadata (names, descriptions, icons). Same
 * for every player, so it's cached for a full day. */
async function fetchGameSchema(
  apiKey: string,
  appId: string
): Promise<Map<string, SchemaAchievement>> {
  const cacheKey = `steam:schema:${appId}`;
  return cached(cacheKey, 24 * 60 * 60 * 1000, async () => {
    const url = `${BASE}/ISteamUserStats/GetSchemaForGame/v2/?appid=${encodeURIComponent(
      appId
    )}&key=${encodeURIComponent(apiKey)}&l=french`;
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      throw new SteamError(`Steam API a répondu ${res.status}`);
    }
    const data = (await res.json()) as {
      game?: {
        availableGameStats?: { achievements?: SchemaAchievement[] };
      };
    };
    const list = data.game?.availableGameStats?.achievements ?? [];
    return new Map(list.map((a) => [a.name, a]));
  });
}

/** Global unlock rate per achievement ("X% of players have this") — public
 * data, same for every player, cached for a day like the schema. */
async function fetchGlobalAchievementRarity(
  appId: string
): Promise<Map<string, number>> {
  const cacheKey = `steam:rarity:${appId}`;
  return cached(cacheKey, 24 * 60 * 60 * 1000, async () => {
    const url = `${BASE}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=${encodeURIComponent(
      appId
    )}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) {
      // Non-critical — achievements still work without rarity, so don't
      // fail the whole request over this.
      return new Map();
    }
    const data = (await res.json().catch(() => null)) as {
      achievementpercentages?: { achievements?: { name: string; percent: number }[] };
    } | null;
    const list = data?.achievementpercentages?.achievements ?? [];
    return new Map(list.map((a) => [a.name, a.percent]));
  });
}

/**
 * Fetches unlock progress and full details for a single game's
 * achievements. Not all games have achievements (Steam reports that as
 * success:false, error:"Requested app has no stats" — a genuine, cacheable
 * "null"). Any other failure (private profile, bad key, network hiccup,
 * rate limit) is a real error and must NOT collapse into the same
 * "no achievements" result, or a transient failure looks identical to
 * "this game has none" and gets cached as such for 30 minutes.
 */
export async function fetchAchievementSummary(
  apiKey: string,
  steamId: string,
  appId: string
): Promise<AchievementDetails | null> {
  const cacheKey = `steam:ach:${steamId}:${appId}`;
  return cached(cacheKey, 30 * 60 * 1000, async () => {
    const url = `${BASE}/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${encodeURIComponent(
      appId
    )}&key=${encodeURIComponent(apiKey)}&steamid=${encodeURIComponent(
      steamId
    )}&l=french&format=json`;

    const res = await fetchWithRetry(url);

    if (!res.ok) {
      let reason = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as {
          playerstats?: { error?: string };
        };
        reason = body.playerstats?.error ?? reason;
      } catch {
        // body wasn't JSON — keep the HTTP-status reason
      }
      if (/no stats/i.test(reason)) {
        return null;
      }
      throw new SteamError(`Succès Steam indisponibles : ${reason}`);
    }

    const data = (await res.json()) as {
      playerstats: {
        success: boolean;
        error?: string;
        achievements?: {
          apiname: string;
          achieved: number;
          unlocktime: number;
          name?: string;
          description?: string;
        }[];
      };
    };

    if (!data.playerstats.success) {
      if (/no stats/i.test(data.playerstats.error ?? "")) {
        return null;
      }
      throw new SteamError(
        `Succès Steam indisponibles : ${
          data.playerstats.error ?? "erreur inconnue"
        }`
      );
    }

    const raw = data.playerstats.achievements;
    if (!raw || raw.length === 0) {
      return null;
    }

    const [schema, rarity] = await Promise.all([
      fetchGameSchema(apiKey, appId),
      fetchGlobalAchievementRarity(appId),
    ]);
    const list = raw
      .map((a) => {
        const meta = schema.get(a.apiname);
        return {
          apiName: a.apiname,
          name: meta?.displayName ?? a.name ?? a.apiname,
          description: meta?.description ?? a.description,
          achieved: a.achieved === 1,
          unlockTime: a.unlocktime
            ? new Date(a.unlocktime * 1000).toISOString()
            : null,
          icon: (a.achieved === 1 ? meta?.icon : meta?.icongray) ?? "",
          rarityPercent: rarity.get(a.apiname),
        };
      })
      .sort((a, b) => {
        if (a.achieved !== b.achieved) return a.achieved ? -1 : 1;
        if (a.achieved && b.achieved) {
          return (
            new Date(b.unlockTime ?? 0).getTime() -
            new Date(a.unlockTime ?? 0).getTime()
          );
        }
        return a.name.localeCompare(b.name);
      });

    const unlocked = list.filter((a) => a.achieved).length;
    return {
      summary: {
        total: list.length,
        unlocked,
        progressPercent: Math.round((unlocked / list.length) * 100),
      },
      list,
    };
  });
}
