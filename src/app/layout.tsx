import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authEnabled, authOptions } from "@/lib/authOptions";
import LogoutButton from "@/components/LogoutButton";
import ShelfieMark from "@/components/ShelfieMark";
import NavLinks from "@/components/NavLinks";
import GlobalSearch from "@/components/GlobalSearch";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

// Runs before React hydrates so the light theme (if chosen) applies before
// first paint instead of flashing dark-then-light. Static string, no user
// input involved — safe to inject directly.
const THEME_INIT_SCRIPT = `try{if(localStorage.getItem('shelfie-theme')==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}`;

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
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-shelf-border/60">
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <Link href="/" className="flex items-center gap-2 text-brass">
                <ShelfieMark className="w-6 h-5" />
                <span className="font-display font-semibold text-lg tracking-tight text-shelf-text">
                  Shelfie
                </span>
              </Link>
              <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <NavLinks />
                <GlobalSearch />
                <ThemeToggle />
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
