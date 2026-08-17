import { NextResponse } from "next/server";
import { buildGogLoginUrl } from "@/lib/gog";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.redirect(buildGogLoginUrl());
}
