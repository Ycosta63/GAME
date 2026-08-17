import { readSettings } from "./settings";
import { fetchOwnedGames, resolveSteamId } from "./steam";
import { fetchPsnLibrary } from "./psn";
import { normalizeTitle } from "./match";
import type {
  LibraryEntry,
  LibraryResponse,
  LibraryStats,
  Platform,
  RawGame,
} from "@/types/game";

export async function buildLibrary(userId: string): Promise<LibraryResponse> {
  const settings = await readSettings(userId);
  const errors: LibraryResponse["errors"] = [];
  const allGames: RawGame[] = [];

  const steamApiKey = settings.steamApiKey || process.env.STEAM_API_KEY;
  if (settings.steamId && !steamApiKey) {
    errors.push({
      platform: "steam",
      message:
        "Compte Steam connecté, mais l'app n'a pas de clé API Steam configurée (STEAM_API_KEY côté serveur).",
    });
  } else if (steamApiKey && settings.steamId) {
    try {
      const steamId = await resolveSteamId(steamApiKey, settings.steamId);
      const games = await fetchOwnedGames(steamApiKey, steamId);
      allGames.push(...games);
    } catch (err) {
      errors.push({
        platform: "steam",
        message: err instanceof Error ? err.message : "Erreur Steam inconnue",
      });
    }
  }

  if (settings.psnNpsso) {
    try {
      const games = await fetchPsnLibrary(settings.psnNpsso);
      allGames.push(...games);
    } catch (err) {
      errors.push({
        platform: "psn",
        message: err instanceof Error ? err.message : "Erreur PSN inconnue",
      });
    }
  }

  const groups = new Map<string, RawGame[]>();
  for (const game of allGames) {
    const key = normalizeTitle(game.name) || game.name.toLowerCase();
    const list = groups.get(key) ?? [];
    list.push(game);
    groups.set(key, list);
  }

  const entries: LibraryEntry[] = Array.from(groups.entries())
    .map(([key, platforms]) => {
      const totalPlaytimeMinutes = platforms.reduce(
        (sum, g) => sum + g.playtimeMinutes,
        0
      );
      const displayName = platforms.reduce((longest, g) =>
        g.name.length > longest.length ? g.name : longest,
        platforms[0].name
      );
      return {
        key,
        displayName,
        totalPlaytimeMinutes,
        platforms: platforms.sort((a, b) => a.platform.localeCompare(b.platform)),
        isDuplicate: platforms.length > 1,
      };
    })
    .sort((a, b) => b.totalPlaytimeMinutes - a.totalPlaytimeMinutes);

  const byPlatform: LibraryStats["byPlatform"] = {
    steam: { games: 0, playtimeMinutes: 0 },
    psn: { games: 0, playtimeMinutes: 0 },
  };
  let totalTrophies = 0;
  let totalPlatinums = 0;
  for (const game of allGames) {
    byPlatform[game.platform].games += 1;
    byPlatform[game.platform].playtimeMinutes += game.playtimeMinutes;
    if (game.trophies) {
      totalTrophies += game.trophies.earned;
      totalPlatinums += game.trophies.platinum;
    }
  }

  const stats: LibraryStats = {
    totalGames: allGames.length,
    uniqueGames: entries.length,
    duplicateGroups: entries.filter((e) => e.isDuplicate).length,
    totalPlaytimeMinutes: allGames.reduce(
      (sum, g) => sum + g.playtimeMinutes,
      0
    ),
    byPlatform,
    totalTrophies,
    totalPlatinums,
    neverPlayed: entries.filter((e) => e.totalPlaytimeMinutes === 0).length,
  };

  return { entries, stats, errors, syncedAt: new Date().toISOString() };
}

export function platformLabel(platform: Platform): string {
  return platform === "steam" ? "Steam" : "PlayStation";
}
