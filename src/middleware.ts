import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)"],
};

export async function middleware(req: NextRequest) {
  // Google sign-in not configured (e.g. local dev): app stays open.
  // Must mirror authOptions.ts's `authEnabled` check exactly — if only one
  // of the two env vars were set, this would otherwise leave the entire
  // site open with no login wall while the rest of the app still thinks
  // auth is disabled and serves the shared "local" account to everyone.
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
