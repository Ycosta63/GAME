import { NextRequest, NextResponse } from "next/server";
import { verifySteamCallback } from "@/lib/steamOpenId";
import { mergeSettings } from "@/lib/settings";
import { UnauthenticatedError, currentUserId } from "@/lib/currentUser";
import { invalidate } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const settingsUrl = new URL("/settings", req.url);

  try {
    const userId = await currentUserId();
    const steamId = await verifySteamCallback(req.nextUrl.searchParams);

    if (!steamId) {
      settingsUrl.searchParams.set("steam_error", "1");
      return NextResponse.redirect(settingsUrl);
    }

    await mergeSettings(userId, { steamId });
    invalidate("steam:");

    settingsUrl.searchParams.set("steam_connected", "1");
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    settingsUrl.searchParams.set("steam_error", "1");
    return NextResponse.redirect(settingsUrl);
  }
}
