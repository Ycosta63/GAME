import { claimJson, deleteJson, listJsonKeys, readJson } from "./store";
import { readSettings } from "./settings";

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

/**
 * Every handle currently claimed AND actually toggled public right now —
 * a handle stays reserved (in the "handle-owner" namespace) even after its
 * owner flips their profile back to private, so presence in the map alone
 * isn't enough; each candidate's settings.publicProfile is the source of
 * truth. Fine for a small community directory; would need pagination well
 * before this scans thousands of handles on every request.
 */
export async function listPublicHandles(): Promise<
  { handle: string; userId: string }[]
> {
  const handles = await listJsonKeys(NAMESPACE);
  const withOwners = await Promise.all(
    handles.map(async (handle) => ({ handle, userId: await ownerForHandle(handle) }))
  );

  const results: { handle: string; userId: string }[] = [];
  await Promise.all(
    withOwners.map(async ({ handle, userId }) => {
      if (!userId) return;
      const settings = await readSettings(userId);
      if (settings.publicProfile) {
        results.push({ handle, userId });
      }
    })
  );
  return results.sort((a, b) => a.handle.localeCompare(b.handle));
}
