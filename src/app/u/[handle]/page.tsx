import { notFound } from "next/navigation";
import { ownerForHandle } from "@/lib/publicHandle";
import { readSettings } from "@/lib/settings";
import { buildLibrary } from "@/lib/library";
import { readGameDataMap } from "@/lib/gameData";
import StatsBar from "@/components/StatsBar";
import PublicLibraryGrid from "@/components/PublicLibraryGrid";

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

  // Never expose personal notes here — only status/rating are meant to be
  // public, same as Letterboxd shows your ratings but not your journal.
  const publicGameData = Object.fromEntries(
    Object.entries(gameData).map(([key, d]) => [
      key,
      { status: d.status, rating: d.rating },
    ])
  );

  return (
    <div className="space-y-6">
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
          <StatsBar stats={library.stats} />
          <PublicLibraryGrid entries={library.entries} gameData={publicGameData} />
        </>
      ) : (
        <p className="text-shelf-muted text-sm">
          Aucun jeu à afficher pour l&apos;instant.
        </p>
      )}
    </div>
  );
}
