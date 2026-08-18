import { NextRequest, NextResponse } from "next/server";
import { buildLibrary } from "@/lib/library";
import { invalidate } from "@/lib/cache";
import { UnauthenticatedError, currentUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await currentUserId();
    const { searchParams } = new URL(req.url);
    if (searchParams.get("force") === "1") {
      await Promise.all([invalidate("steam:"), invalidate("psn:")]);
    }
    const library = await buildLibrary(userId);
    return NextResponse.json(library);
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}
