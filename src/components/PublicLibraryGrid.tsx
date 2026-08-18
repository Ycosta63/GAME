"use client";

import GameCard from "./GameCard";
import type { GameStatus, LibraryEntry } from "@/types/game";

export default function PublicLibraryGrid({
  entries,
  gameData,
}: {
  entries: LibraryEntry[];
  gameData: Record<string, { status?: GameStatus; rating?: number }>;
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-1">
      {entries.map((entry) => (
        <GameCard
          key={entry.key}
          entry={entry}
          status={gameData[entry.key]?.status}
          rating={gameData[entry.key]?.rating}
          onSelect={() => {}}
        />
      ))}
    </div>
  );
}
