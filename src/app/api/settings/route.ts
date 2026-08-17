import { NextRequest, NextResponse } from "next/server";
import {
  mergeSettings,
  readSettings,
  redactSettings,
  writeSettings,
} from "@/lib/settings";
import { invalidate } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(redactSettings(settings));
}

export async function POST(req: NextRequest) {
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

  const next = await mergeSettings(patch);
  invalidate("steam:");
  invalidate("psn:");

  return NextResponse.json(redactSettings(next));
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field");
  const current = await readSettings();

  if (field === "steam") {
    delete current.steamApiKey;
    delete current.steamId;
  } else if (field === "psn") {
    delete current.psnNpsso;
  }

  await writeSettings(current);
  invalidate("steam:");
  invalidate("psn:");

  return NextResponse.json(redactSettings(current));
}
