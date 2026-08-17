import { cached } from "./cache";
import { mergeSettings } from "./settings";
import type { RawGame } from "@/types/game";

// GOG has no public developer program — there is no way for a third-party
// app to register its own OAuth client. These are GOG Galaxy's own client
// credentials, the same ones open-source tools (Heroic Games Launcher,
// gogdl, MiniGalaxy) use for exactly this reason. They are not secret in
// any meaningful sense: they ship inside the public Galaxy client itself.
const GOG_CLIENT_ID = "46899977096215655";
const GOG_CLIENT_SECRET =
  "9d85c43b1482497dbbce61f6e4aa173a433796eeae2ca8c5f6129f2dc4de46d";
// GOG only allows this exact redirect_uri for Galaxy's client_id — it's a
// GOG-owned page, not ours, which is why the user has to copy the code out
// of that page's URL by hand instead of GOG redirecting back to our site.
const GOG_REDIRECT_URI = "https://embed.gog.com/on_login_success?origin=client";

export class GogError extends Error {}

export function buildGogLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: GOG_CLIENT_ID,
    redirect_uri: GOG_REDIRECT_URI,
    response_type: "code",
    layout: "client2",
  });
  return `https://auth.gog.com/auth?${params.toString()}`;
}

interface GogTokenResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
}

async function requestGogToken(
  params: Record<string, string>
): Promise<GogTokenResponse> {
  const url = `https://auth.gog.com/token?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new GogError(
      "Code invalide ou expiré — relance la connexion GOG et recopie le code rapidement."
    );
  }
  return res.json() as Promise<GogTokenResponse>;
}

export function exchangeGogCode(code: string): Promise<GogTokenResponse> {
  return requestGogToken({
    client_id: GOG_CLIENT_ID,
    client_secret: GOG_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: GOG_REDIRECT_URI,
  });
}

function refreshGogToken(refreshToken: string): Promise<GogTokenResponse> {
  return requestGogToken({
    client_id: GOG_CLIENT_ID,
    client_secret: GOG_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

interface GogOwnedGamesResponse {
  owned: number[];
}

interface GogProduct {
  id: number;
  title: string;
  image?: string;
}

function normalizeGogImage(image?: string): string | undefined {
  if (!image) return undefined;
  const withProtocol = image.startsWith("//") ? `https:${image}` : image;
  return `${withProtocol}.jpg`;
}

/**
 * Fetches the GOG library for a user. GOG access tokens are short-lived;
 * on a 401 this transparently refreshes and persists the new tokens before
 * retrying once.
 */
export async function fetchGogLibrary(
  userId: string,
  accessToken: string,
  refreshToken: string
): Promise<RawGame[]> {
  const cacheKey = `gog:library:${userId}`;
  return cached(cacheKey, 10 * 60 * 1000, async () => {
    let token = accessToken;

    async function authedFetch(url: string): Promise<Response> {
      let res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.status === 401) {
        const refreshed = await refreshGogToken(refreshToken);
        token = refreshed.access_token;
        await mergeSettings(userId, {
          gogAccessToken: refreshed.access_token,
          gogRefreshToken: refreshed.refresh_token,
        });
        res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
      }
      return res;
    }

    const ownedRes = await authedFetch("https://embed.gog.com/user/data/games");
    if (!ownedRes.ok) {
      throw new GogError(`API GOG a répondu ${ownedRes.status}`);
    }
    const owned = (await ownedRes.json()) as GogOwnedGamesResponse;
    const ids = owned.owned ?? [];
    if (ids.length === 0) return [];

    const games: RawGame[] = [];
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const res = await fetch(
        `https://api.gog.com/products?ids=${batch.join(",")}`,
        { cache: "no-store" }
      );
      if (!res.ok) continue;
      const data = (await res.json()) as GogProduct[];
      for (const product of data) {
        games.push({
          platform: "gog",
          id: String(product.id),
          name: product.title,
          // GOG's API doesn't expose playtime the way Steam/PSN do — Galaxy
          // tracks it locally on the client, not centrally.
          playtimeMinutes: 0,
          coverUrl: normalizeGogImage(product.image),
          lastPlayed: null,
        });
      }
    }

    return games;
  });
}
