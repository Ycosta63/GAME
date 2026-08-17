import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, computeSessionToken, timingSafeEqualHex } from "@/lib/auth";

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/login|api/logout).*)",
  ],
};

export async function middleware(req: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;

  // No password configured (e.g. local dev): app stays open, same as before.
  if (!appPassword) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const expected = await computeSessionToken(appPassword);

  if (cookie && timingSafeEqualHex(cookie, expected)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
