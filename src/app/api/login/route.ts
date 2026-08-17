import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  computeSessionToken,
  hashPassword,
  timingSafeEqualHex,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.json(
      { error: "Aucun mot de passe n'est configuré côté serveur (APP_PASSWORD)." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";

  const [submittedHash, expectedHash] = await Promise.all([
    hashPassword(password),
    hashPassword(appPassword),
  ]);

  if (!timingSafeEqualHex(submittedHash, expectedHash)) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  const token = await computeSessionToken(appPassword);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
