import { claimJson, deleteJson, readJson } from "./store";

const NAMESPACE = "handle-owner";

// Letterboxd-style handle: lowercase letters/digits/dashes, 3-24 chars,
// can't start or end with a dash.
const HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])?$/;

export function isValidHandle(handle: string): boolean {
  return HANDLE_PATTERN.test(handle);
}

export function normalizeHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

export async function ownerForHandle(handle: string): Promise<string | null> {
  return readJson<string | null>(NAMESPACE, normalizeHandle(handle), null);
}

/** Claims a handle for a user, releasing their previous handle (if any and
 * different) so it doesn't stay squatted. Returns false if the handle is
 * already taken by someone else. */
export async function claimHandle(
  userId: string,
  handle: string,
  previousHandle: string | undefined
): Promise<boolean> {
  const normalized = normalizeHandle(handle);
  const previous = previousHandle ? normalizeHandle(previousHandle) : undefined;
  if (previous === normalized) {
    return true;
  }

  const existingOwner = await ownerForHandle(normalized);
  if (existingOwner && existingOwner !== userId) {
    return false;
  }

  const claimed = existingOwner === userId || (await claimJson(NAMESPACE, normalized, userId));
  if (!claimed) {
    return false;
  }
  if (previous) {
    await deleteJson(NAMESPACE, previous);
  }
  return true;
}

export async function releaseHandle(handle: string): Promise<void> {
  await deleteJson(NAMESPACE, normalizeHandle(handle));
}
