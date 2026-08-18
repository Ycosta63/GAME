import Link from "next/link";
import { listPublicHandles } from "@/lib/publicHandle";
import { buildLibrary } from "@/lib/library";
import { currentUserId } from "@/lib/currentUser";
import { formatHours } from "@/lib/format";

export const dynamic = "force-dynamic";

// Small community, not a real leaderboard product — cap how many profiles
// we'll build stats for on one page load so this can't quietly turn into
// dozens of external API calls per visit as the user count grows.
const MAX_PROFILES = 60;

export default async function CommunityPage() {
  const [handles, ownUserId] = await Promise.all([
    listPublicHandles(),
    currentUserId().catch(() => null),
  ]);

  const capped = handles.slice(0, MAX_PROFILES);
  const profiles = await Promise.all(
    capped.map(async ({ handle, userId }) => {
      const library = await buildLibrary(userId).catch(() => null);
      return {
        handle,
        userId,
        isYou: userId === ownUserId,
        uniqueGames: library?.stats.uniqueGames ?? 0,
        playtimeMinutes: library?.stats.totalPlaytimeMinutes ?? 0,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-shelf-text">
          Communauté
        </h1>
        <p className="text-shelf-muted text-sm mt-1">
          Les bibliothèques que d&apos;autres joueurs ont choisi de rendre
          publiques.
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-shelf-card border border-shelf-border rounded-xl px-6 py-10 text-center space-y-2">
          <p className="text-shelf-muted">
            Personne n&apos;a encore rendu son profil public.
          </p>
          <Link
            href="/settings"
            className="inline-block text-sm text-brass hover:text-brass-hover underline"
          >
            Sois le premier — active ton profil public dans les réglages
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {profiles.map((p) => (
            <Link
              key={p.handle}
              href={`/u/${p.handle}`}
              className="bg-shelf-card border border-shelf-border rounded-xl p-4 flex items-center justify-between hover:border-brass/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-shelf-text font-semibold truncate">
                    @{p.handle}
                  </span>
                  {p.isYou && (
                    <span className="text-[10px] uppercase tracking-wide text-brass border border-brass/40 rounded-full px-1.5 py-0.5 flex-shrink-0">
                      Toi
                    </span>
                  )}
                </div>
                <div className="text-xs text-shelf-muted mt-1">
                  {p.uniqueGames} jeu(x) · {formatHours(p.playtimeMinutes)}
                </div>
              </div>
              <span className="text-shelf-muted/60 text-lg flex-shrink-0">
                →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
