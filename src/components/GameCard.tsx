"use client";

import { useState } from "react";
import type { LibraryEntry } from "@/types/game";
import { formatHours } from "@/lib/format";
import { placeholderGradient } from "@/lib/placeholder";

function steamFallbackUrl(entry: LibraryEntry): string | undefined {
  const steam = entry.platforms.find((p) => p.platform === "steam");
  return steam ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steam.id}/header.jpg` : undefined;
}

export default function GameCard({
  entry,
  onSelect,
}: {
  entry: LibraryEntry;
  onSelect: () => void;
}) {
  const [stage, setStage] = useState<"cover" | "fallback" | "none">("cover");

  const coverUrl = entry.platforms.find((p) => p.coverUrl)?.coverUrl;
  const fallbackUrl = steamFallbackUrl(entry);
  const src = stage === "cover" ? coverUrl : stage === "fallback" ? fallbackUrl : undefined;

  return (
    <button
      onClick={onSelect}
      className="group relative aspect-[2/3] w-full rounded-md overflow-hidden bg-shelf-surface border border-shelf-border text-left outline-none focus-visible:ring-2 focus-visible:ring-brass/70 transition-shadow hover:shadow-lg hover:shadow-black/40"
    >
      {src ? (
        <img
          src={src}
          alt=""
          onError={() =>
            setStage((s) => (s === "cover" && fallbackUrl ? "fallback" : "none"))
          }
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center p-3 transition-transform duration-300 group-hover:scale-[1.04]"
          style={{ background: placeholderGradient(entry.displayName) }}
        >
          <span className="font-display text-shelf-text/80 text-sm text-center leading-snug line-clamp-5">
            {entry.displayName}
          </span>
        </div>
      )}

      {entry.isDuplicate && (
        <span
          className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rust ring-2 ring-shelf-bg"
          title={`Doublon ×${entry.platforms.length}`}
        />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-8 pb-1.5">
        <div className="text-xs font-medium text-white truncate">
          {entry.displayName}
        </div>
        <div className="text-[10px] text-white/60">
          {formatHours(entry.totalPlaytimeMinutes)}
        </div>
      </div>
    </button>
  );
}
