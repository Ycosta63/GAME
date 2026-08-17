import { NextResponse } from "next/server";
import { readSettings } from "@/lib/settings";
import { fetchAchievementSummary, resolveSteamId } from "@/lib/steam";

export async function GET(
  _req: Request,
  { params }: { params: { appid: string } }
) {
  const settings = readSettings();
  if (!settings.steamApiKey || !settings.steamId) {
    return NextResponse.json(
      { error: "Steam non configuré" },
      { status: 400 }
    );
  }

  try {
    const steamId = await resolveSteamId(settings.steamApiKey, settings.steamId);
    const summary = await fetchAchievementSummary(
      settings.steamApiKey,
      steamId,
      params.appid
    );
    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
