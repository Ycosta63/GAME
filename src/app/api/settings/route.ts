import { NextRequest, NextResponse } from "next/server";
import {
  mergeSettings,
  readSettings,
  redactSettings,
  writeSettings,
} from "@/lib/settings";
import { invalidate } from "@/lib/cache";
import { UnauthenticatedError, currentUserId } from "@/lib/currentUser";

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
    const patch: Record<string, string> = {};

    if (typeof body.steamApiKey === "string" && body.steamApiKey.trim()) {
      patch.steamApiKey = body.steamApiKey.trim();
    }
    if (typeof body.steamId === "string" && body.steamId.trim()) {
      patch.steamId = body.steamId.trim();
    }
    if (typeof body.psnNpsso === "string" && body.psnNpsso.trim()) {
      patch.psnNpsso = body.psnNpsso.trim();
    }

    const next = await mergeSettings(userId, patch);
    invalidate("steam:");
    invalidate("psn:");
    invalidate("gog:");

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
    } else if (field === "gog") {
      delete current.gogAccessToken;
      delete current.gogRefreshToken;
      delete current.gogUserId;
    }

    await writeSettings(userId, current);
    invalidate("steam:");
    invalidate("psn:");
    invalidate("gog:");

    return NextResponse.json(redactSettings(current));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
