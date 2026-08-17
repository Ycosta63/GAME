import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authEnabled, authOptions } from "@/lib/authOptions";
import LogoutButton from "@/components/LogoutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Library Hub",
  description:
    "Toute ta bibliothèque de jeux Steam et PlayStation au même endroit.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = authEnabled ? await getServerSession(authOptions) : null;

  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-white/10 bg-[#14161b]">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="font-semibold text-lg tracking-tight">
                🎮 Game Library Hub
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Bibliothèque
                </Link>
                <Link
                  href="/settings"
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Réglages
                </Link>
                {session?.user && (
                  <div className="flex items-center gap-2">
                    {session.user.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-6 h-6 rounded-full"
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
          <footer className="text-center text-xs text-white/30 py-6">
            Steam via Steam Web API · PlayStation via psn-api (non officiel)
          </footer>
        </div>
      </body>
    </html>
  );
}
