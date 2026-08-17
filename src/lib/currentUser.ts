import { getServerSession } from "next-auth";
import { authEnabled, authOptions } from "./authOptions";

/** Used when Google sign-in isn't configured (local dev with zero setup). */
export const LOCAL_USER_ID = "local";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Non authentifié");
  }
}

/** Resolves the id used to key the current user's isolated settings. */
export async function currentUserId(): Promise<string> {
  if (!authEnabled) {
    return LOCAL_USER_ID;
  }
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) {
    throw new UnauthenticatedError();
  }
  return id;
}
