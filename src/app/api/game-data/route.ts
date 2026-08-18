import { NextRequest, NextResponse } from "next/server";
import { TooManyFavoritesError, readGameDataMap, setGameData } from "@/lib/gameData";
import { UnauthenticatedError, currentUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await currentUserId();
    const map = await readGameDataMap(userId);
    return NextResponse.json(map);
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
    const key = typeof body.key === "string" ? body.key : "";
    if (!key) {
      return NextResponse.json({ error: "Clé manquante" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if ("status" in body) patch.status = body.status;
    if ("rating" in body) patch.rating = body.rating;
    if ("note" in body) patch.note = body.note;
    if ("favorite" in body) patch.favorite = body.favorite;
    if ("publicReview" in body) patch.publicReview = body.publicReview;

    const map = await setGameData(userId, key, patch);
    return NextResponse.json(map[key] ?? {});
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof TooManyFavoritesError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
