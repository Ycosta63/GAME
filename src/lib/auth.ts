export const SESSION_COOKIE = "glh_auth";

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return bufferToHex(digest);
}

/** Constant-time comparison of two equal-length hex digests. */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  return sha256Hex(password);
}

/** Derives the session cookie value from the configured app password. */
export async function computeSessionToken(appPassword: string): Promise<string> {
  const secret = process.env.AUTH_SECRET ?? appPassword;
  return sha256Hex(`${appPassword}:${secret}`);
}
