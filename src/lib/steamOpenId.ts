const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

/** Builds the URL that starts Steam's OpenID 2.0 "sign in" flow. Unlike
 * Google, Steam has no developer console / redirect URI allowlist to
 * configure — any realm is accepted. */
export function buildSteamLoginUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

/**
 * Verifies a Steam OpenID callback by posting the received params back to
 * Steam with mode=check_authentication (per the OpenID 2.0 spec) — this is
 * what stops someone from forging a callback that claims an arbitrary
 * SteamID. Returns the verified SteamID64, or null if invalid.
 */
export async function verifySteamCallback(
  query: URLSearchParams
): Promise<string | null> {
  const claimedId = query.get("openid.claimed_id");
  if (!claimedId) return null;

  const match = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/.exec(
    claimedId
  );
  if (!match) return null;

  const verifyParams = new URLSearchParams(query);
  verifyParams.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const text = await res.text();
  if (!/is_valid\s*:\s*true/.test(text)) return null;

  return match[1];
}
