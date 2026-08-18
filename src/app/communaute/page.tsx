import Link from "next/link";
import { listPublicHandles } from "@/lib/publicHandle";
import { buildLibrary } from "@/lib/library";
import { readGameDataMap } from "@/lib/gameData";
import { currentUserId } from "@/lib/currentUser";
import { formatHours } from "@/lib/format";
import { cached } from "@/lib/cache";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface ProfileCard {
  handle: string;
  userId: string;
  uniqueGames: number;
  playtimeMinutes: number;
  hasPlatinum: boolean;
  hasCompleted: boolean;
}

async function buildProfileCard(
  handle: string,
  userId: string
): Promise<ProfileCard> {
  const [library, gameData] = await Promise.all([
    buildLibrary(userId).catch(() => null),
    readGameDataMap(userId).catch(() => ({})),
  ]);
  return {
    handle,
    userId,
    uniqueGames: library?.stats.uniqueGames ?? 0,
    playtimeMinutes: library?.stats.totalPlaytimeMinutes ?? 0,
    hasPlatinum: (library?.stats.totalPlatinums ?? 0) > 0,
    // "100% terminé" here means the profile owner marked a game as
    // "Terminé" themselves — not a live Steam achievement check, which
    // would mean one external API call per profile per directory visit.
    hasCompleted: Object.values(gameData).some((d) => d.status === "completed"),
  };
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const [allHandles, ownUserId] = await Promise.all([
    listPublicHandles(),
    currentUserId().catch(() => null),
  ]);

  const query = (searchParams.q ?? "").trim().toLowerCase();
  const requestedPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const filtered = query
    ? allHandles.filter((h) => h.handle.includes(query))
    : allHandles;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageSlice = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Only the default (unsearched) browse is cached — a search is a one-off
  // lookup, usually over a small result set already, so caching it would
  // just grow the cache namespace for little benefit. Note: because a
  // cache hit skips recomputing pageSlice's contents, the profiles shown
  // can lag up to 5 minutes behind who's actually public right now, while
  // the pagination controls above (built from the always-fresh handle
  // list) do not — same staleness trade-off already made for achievement
  // and library caches elsewhere in the app.
  const profiles = query
    ? await Promise.all(pageSlice.map((h) => buildProfileCard(h.handle, h.userId)))
    : await cached(`community:page:${currentPage}`, 5 * 60 * 1000, () =>
        Promise.all(pageSlice.map((h) => buildProfileCard(h.handle, h.userId)))
      );

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/communaute?${qs}` : "/communaute";
  }

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

      <form method="get" className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Rechercher un pseudo…"
          className="w-full bg-shelf-card border border-shelf-border rounded-full px-4 py-2 text-sm text-shelf-text outline-none focus:border-brass/50"
        />
      </form>

      {allHandles.length === 0 ? (
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
      ) : profiles.length === 0 ? (
        <p className="text-shelf-muted text-sm">
          Aucun profil ne correspond à &quot;{query}&quot;.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map((p) => (
              <Link
                key={p.handle}
                href={`/u/${p.handle}`}
                className="bg-shelf-card border border-shelf-border rounded-xl p-4 flex items-center justify-between hover:border-brass/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-shelf-text font-semibold truncate">
                      @{p.handle}
                    </span>
                    {p.userId === ownUserId && (
                      <span className="text-[10px] uppercase tracking-wide text-brass border border-brass/40 rounded-full px-1.5 py-0.5 flex-shrink-0">
                        Toi
                      </span>
                    )}
                    {p.hasPlatinum && (
                      <span title="A un platine PlayStation" className="text-xs flex-shrink-0">
                        🏆
                      </span>
                    )}
                    {p.hasCompleted && (
                      <span
                        title="A marqué au moins un jeu comme terminé"
                        className="text-[10px] uppercase tracking-wide text-sage border border-sage/40 rounded-full px-1.5 py-0.5 flex-shrink-0"
                      >
                        100%
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 text-sm">
              {currentPage > 1 ? (
                <Link href={pageHref(currentPage - 1)} className="text-brass hover:text-brass-hover">
                  ← Précédent
                </Link>
              ) : (
                <span className="text-shelf-muted/40">← Précédent</span>
              )}
              <span className="text-shelf-muted">
                Page {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link href={pageHref(currentPage + 1)} className="text-brass hover:text-brass-hover">
                  Suivant →
                </Link>
              ) : (
                <span className="text-shelf-muted/40">Suivant →</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
