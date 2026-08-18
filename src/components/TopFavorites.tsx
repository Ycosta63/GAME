"use client";

import GameCard from "./GameCard";
import type { LibraryEntry } from "@/types/game";

export default function TopFavorites({ entries }: { entries: LibraryEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-shelf-text">Top {entries.length}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
        {entries.map((entry) => (
          <GameCard key={entry.key} entry={entry} favorite onSelect={() => {}} />
        ))}
      </div>
    </section>
  );
}
