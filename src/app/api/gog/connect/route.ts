import { NextRequest, NextResponse } from "next/server";
import { exchangeGogCode } from "@/lib/gog";
import { mergeSettings, redactSettings } from "@/lib/settings";
import { UnauthenticatedError, currentUserId } from "@/lib/currentUser";
import { invalidate } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = await currentUserId();
    const body = await req.json().catch(() => ({}));
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!code) {
      return NextResponse.json({ error: "Code manquant" }, { status: 400 });
    }

    const tokens = await exchangeGogCode(code);
    const next = await mergeSettings(userId, {
      gogAccessToken: tokens.access_token,
      gogRefreshToken: tokens.refresh_token,
      gogUserId: tokens.user_id,
    });
    await invalidate("gog:");

    return NextResponse.json(redactSettings(next));
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 400 }
    );
  }
}
