import { NextRequest, NextResponse } from "next/server";
import { buildSteamLoginUrl } from "@/lib/steamOpenId";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const returnTo = `${origin}/api/steam/callback`;
  return NextResponse.redirect(buildSteamLoginUrl(returnTo, origin));
}
