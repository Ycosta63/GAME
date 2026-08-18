import { notFound } from "next/navigation";
import { ownerForHandle } from "@/lib/publicHandle";
import { readSettings } from "@/lib/settings";
import { buildLibrary } from "@/lib/library";
import { readGameDataMap } from "@/lib/gameData";
import StatsBar from "@/components/StatsBar";
import PublicLibraryGrid from "@/components/PublicLibraryGrid";
import TopFavorites from "@/components/TopFavorites";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: { handle: string };
}) {
  const ownerId = await ownerForHandle(params.handle);
  if (!ownerId) notFound();

  const settings = await readSettings(ownerId);
  if (!settings.publicProfile) notFound();

  const [library, gameData] = await Promise.all([
    buildLibrary(ownerId),
    readGameDataMap(ownerId),
  ]);

  // Never expose personal notes here — only status/rating/favorite are
  // meant to be public, same as Letterboxd shows your ratings but not
  // your private journal. publicReview is rendered separately below
  // (per-review, not per-card) so it's left out of this per-card map.
  const publicGameData = Object.fromEntries(
    Object.entries(gameData).map(([key, d]) => [
      key,
      { status: d.status, rating: d.rating, favorite: d.favorite },
    ])
  );

  const favoriteEntries = library.entries.filter((e) => gameData[e.key]?.favorite);

  const reviews = library.entries
    .filter((e) => gameData[e.key]?.publicReview)
    .map((e) => ({
      key: e.key,
      title: e.displayName,
      rating: gameData[e.key]?.rating,
      text: gameData[e.key]!.publicReview!,
      updatedAt: gameData[e.key]?.updatedAt ?? "",
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-shelf-text">
          @{settings.publicHandle}
        </h1>
        <p className="text-shelf-muted text-sm mt-1">
          Bibliothèque publique — {library.stats.uniqueGames} jeu(x)
        </p>
      </div>

      {library.entries.length > 0 ? (
        <>
          <TopFavorites entries={favoriteEntries} />

          <StatsBar stats={library.stats} />

          {reviews.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-shelf-text">Avis</h2>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r.key}
                    className="bg-shelf-card border border-shelf-border rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-shelf-text font-medium">{r.title}</span>
                      {r.rating && (
                        <span className="text-brass text-sm flex-shrink-0">
                          {"★".repeat(r.rating)}
                          <span className="text-shelf-muted/50">
                            {"★".repeat(5 - r.rating)}
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-shelf-muted text-sm mt-1.5 whitespace-pre-wrap">
                      {r.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-shelf-text">
              Toute la bibliothèque
            </h2>
            <PublicLibraryGrid entries={library.entries} gameData={publicGameData} />
          </section>
        </>
      ) : (
        <p className="text-shelf-muted text-sm">
          Aucun jeu à afficher pour l&apos;instant.
        </p>
      )}
    </div>
  );
}
