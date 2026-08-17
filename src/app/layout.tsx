import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authEnabled, authOptions } from "@/lib/authOptions";
import LogoutButton from "@/components/LogoutButton";
import ShelfieMark from "@/components/ShelfieMark";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

const displayFont = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Shelfie",
  description:
    "Toute ta bibliothèque de jeux Steam et PlayStation, rangée au même endroit.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = authEnabled ? await getServerSession(authOptions) : null;

  return (
    <html lang="fr" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="font-sans">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-shelf-border/60">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-brass">
                <ShelfieMark className="w-6 h-5" />
                <span className="font-display font-semibold text-lg tracking-tight text-shelf-text">
                  Shelfie
                </span>
              </Link>
              <nav className="flex items-center gap-5 text-sm">
                <NavLinks />
                {session?.user && (
                  <div className="flex items-center gap-2">
                    {session.user.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-6 h-6 rounded-full ring-1 ring-shelf-border"
                      />
                    )}
                    <LogoutButton />
                  </div>
                )}
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
            {children}
          </main>
          <footer className="text-center text-xs text-shelf-muted/60 py-6">
            Steam via Steam Web API · PlayStation via psn-api (non officiel)
          </footer>
        </div>
      </body>
    </html>
  );
}
