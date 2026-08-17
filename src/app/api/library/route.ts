import { NextResponse } from "next/server";
import { buildLibrary } from "@/lib/library";

export const dynamic = "force-dynamic";

export async function GET() {
  const library = await buildLibrary();
  return NextResponse.json(library);
}
