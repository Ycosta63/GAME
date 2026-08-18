import { NextRequest, NextResponse } from "next/server";
import type { AppSettings } from "@/lib/settings";
import {
  mergeSettings,
  readSettings,
  redactSettings,
  writeSettings,
} from "@/lib/settings";
import { invalidate } from "@/lib/cache";
import { UnauthenticatedError, currentUserId } from "@/lib/currentUser";
import { claimHandle, isValidHandle, releaseHandle } from "@/lib/publicHandle";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await currentUserId();
    const settings = await readSettings(userId);
    return NextResponse.json(redactSettings(settings));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    const body = await req.json().catch(() => ({}));
    const patch: Partial<AppSettings> = {};

    if (typeof body.steamApiKey === "string" && body.steamApiKey.trim()) {
      patch.steamApiKey = body.steamApiKey.trim();
    }
    if (typeof body.steamId === "string" && body.steamId.trim()) {
      patch.steamId = body.steamId.trim();
    }
    if (typeof body.psnNpsso === "string" && body.psnNpsso.trim()) {
      patch.psnNpsso = body.psnNpsso.trim();
      patch.psnNpssoSavedAt = new Date().toISOString();
    }

    if (typeof body.publicHandle === "string" && body.publicHandle.trim()) {
      const handle = body.publicHandle.trim().toLowerCase();
      if (!isValidHandle(handle)) {
        return NextResponse.json(
          {
            error:
              "Le nom doit faire 3 à 24 caractères : lettres minuscules, chiffres, tirets (pas au début/fin).",
          },
          { status: 400 }
        );
      }
      const current = await readSettings(userId);
      const claimed = await claimHandle(userId, handle, current.publicHandle);
      if (!claimed) {
        return NextResponse.json(
          { error: "Ce nom est déjà pris." },
          { status: 409 }
        );
      }
      patch.publicHandle = handle;
    }

    if (typeof body.publicProfile === "boolean") {
      const current = await readSettings(userId);
      const handle = patch.publicHandle ?? current.publicHandle;
      if (body.publicProfile && !handle) {
        return NextResponse.json(
          { error: "Choisis d'abord un nom pour ton profil public." },
          { status: 400 }
        );
      }
      patch.publicProfile = body.publicProfile;
    }

    const next = await mergeSettings(userId, patch);
    await Promise.all([
      invalidate("steam:"),
      invalidate("psn:"),
      invalidate("gog:"),
    ]);

    return NextResponse.json(redactSettings(next));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await currentUserId();
    const { searchParams } = new URL(req.url);
    const field = searchParams.get("field");
    const current = await readSettings(userId);

    if (field === "steam") {
      delete current.steamApiKey;
      delete current.steamId;
    } else if (field === "psn") {
      delete current.psnNpsso;
      delete current.psnNpssoSavedAt;
    } else if (field === "gog") {
      delete current.gogAccessToken;
      delete current.gogRefreshToken;
      delete current.gogUserId;
    } else if (field === "public") {
      if (current.publicHandle) {
        await releaseHandle(current.publicHandle);
      }
      delete current.publicProfile;
      delete current.publicHandle;
    }

    await writeSettings(userId, current);
    await Promise.all([
      invalidate("steam:"),
      invalidate("psn:"),
      invalidate("gog:"),
    ]);

    return NextResponse.json(redactSettings(current));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
