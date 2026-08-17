import { NextRequest, NextResponse } from "next/server";
import { buildLibrary } from "@/lib/library";
import { invalidate } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("force") === "1") {
    invalidate("steam:");
    invalidate("psn:");
  }
  const library = await buildLibrary();
  return NextResponse.json(library);
}
