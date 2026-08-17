import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getUserTitles,
} from "psn-api";
import { cached } from "./cache";
import type { RawGame, TrophySummary } from "@/types/game";

export class PsnError extends Error {}

/** Parses an ISO-8601 duration (e.g. "PT12H34M56S") into minutes. */
function parseIsoDurationToMinutes(iso?: string): number {
  if (!iso) return 0;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 60 + minutes + Math.round(seconds / 60);
}

async function getAuthorization(npsso: string) {
  const cacheKey = `psn:auth:${npsso.slice(0, 12)}`;
  return cached(cacheKey, 25 * 60 * 1000, async () => {
    try {
      const accessCode = await exchangeNpssoForAccessCode(npsso);
      return exchangeAccessCodeForAuthTokens(accessCode);
    } catch {
      throw new PsnError(
        "Jeton NPSSO invalide ou expiré. Récupère-en un nouveau depuis ton compte PlayStation."
      );
    }
  });
}

export async function fetchPsnLibrary(npsso: string): Promise<RawGame[]> {
  const authorization = await getAuthorization(npsso);

  const cacheKey = `psn:titles:${npsso.slice(0, 12)}`;
  return cached(cacheKey, 5 * 60 * 1000, async () => {
    const games: RawGame[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const page = await getUserTitles(
        { accessToken: authorization.accessToken },
        "me",
        { limit, offset }
      );

      for (const title of page.trophyTitles) {
        const defined = title.definedTrophies;
        const earned = title.earnedTrophies;
        const totalDefined =
          defined.bronze + defined.silver + defined.gold + defined.platinum;
        const totalEarned =
          earned.bronze + earned.silver + earned.gold + earned.platinum;

        const trophies: TrophySummary = {
          platinum: earned.platinum,
          gold: earned.gold,
          silver: earned.silver,
          bronze: earned.bronze,
          total: totalDefined,
          earned: totalEarned,
          progressPercent:
            totalDefined > 0
              ? Math.round((totalEarned / totalDefined) * 100)
              : 0,
        };

        games.push({
          platform: "psn",
          id: title.npCommunicationId,
          name: title.trophyTitleName,
          playtimeMinutes: parseIsoDurationToMinutes(
            (title as unknown as { playDuration?: string }).playDuration
          ),
          coverUrl: title.trophyTitleIconUrl,
          lastPlayed: title.lastUpdatedDateTime ?? null,
          trophies,
        });
      }

      offset += page.trophyTitles.length;
      if (offset >= page.totalItemCount || page.trophyTitles.length === 0) {
        break;
      }
    }

    return games;
  });
}
