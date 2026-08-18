import { currentUserId } from "@/lib/currentUser";
import { buildLibrary } from "@/lib/library";
import { CLASSICS } from "@/lib/classics";
import ClassicsGrid from "@/components/ClassicsGrid";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const userId = await currentUserId();
  const library = await buildLibrary(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-shelf-text">
          Découvrir
        </h1>
        <p className="text-shelf-muted text-sm mt-1">
          Une sélection éditoriale de jeux reconnus, comparée à ta
          bibliothèque — ce qui manque encore à ton étagère.
        </p>
      </div>

      <ClassicsGrid entries={library.entries} limit={CLASSICS.length} />
    </div>
  );
}
