import { NextResponse } from "next/server";
import { readSettings } from "@/lib/settings";
import { fetchAchievementSummary, resolveSteamId } from "@/lib/steam";
import { UnauthenticatedError, currentUserId } from "@/lib/currentUser";

export async function GET(
  _req: Request,
  { params }: { params: { appid: string } }
) {
  try {
    const userId = await currentUserId();
    const settings = await readSettings(userId);
    if (!settings.steamApiKey || !settings.steamId) {
      return NextResponse.json(
        { error: "Steam non configuré" },
        { status: 400 }
      );
    }

    const steamId = await resolveSteamId(settings.steamApiKey, settings.steamId);
    const summary = await fetchAchievementSummary(
      settings.steamApiKey,
      steamId,
      params.appid
    );
    return NextResponse.json({ summary });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
