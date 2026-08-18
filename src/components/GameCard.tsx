"use client";

import { useState } from "react";
import Image from "next/image";
import { GAME_STATUS_LABELS, type GameStatus, type LibraryEntry } from "@/types/game";
import { formatHours } from "@/lib/format";
import { placeholderGradient } from "@/lib/placeholder";

const STATUS_DOT: Partial<Record<GameStatus, string>> = {
  playing: "bg-brass",
  completed: "bg-sage",
  abandoned: "bg-rust",
};

function steamFallbackUrl(entry: LibraryEntry): string | undefined {
  const steam = entry.platforms.find((p) => p.platform === "steam");
  return steam ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steam.id}/header.jpg` : undefined;
}

export default function GameCard({
  entry,
  status,
  rating,
  favorite,
  onSelect,
}: {
  entry: LibraryEntry;
  status?: GameStatus;
  rating?: number;
  favorite?: boolean;
  onSelect: () => void;
}) {
  const [stage, setStage] = useState<"cover" | "fallback" | "none">("cover");

  // unoptimized: Vercel's free tier caps server-side image optimization at
  // 1,000 transforms/month account-wide, which a library grid would blow
  // through fast. next/image still buys lazy-loading + no layout shift
  // over a plain <img>, just skips the (paid-beyond-free-tier) resizing.

  const coverUrl = entry.platforms.find((p) => p.coverUrl)?.coverUrl;
  const fallbackUrl = steamFallbackUrl(entry);
  const src = stage === "cover" ? coverUrl : stage === "fallback" ? fallbackUrl : undefined;

  return (
    <button
      onClick={onSelect}
      className="group relative aspect-[2/3] w-full rounded-sm overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 11vw, (min-width: 640px) 18vw, 24vw"
          unoptimized
          onError={() =>
            setStage((s) => (s === "cover" && fallbackUrl ? "fallback" : "none"))
          }
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        />
      ) : (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          style={{ background: placeholderGradient(entry.displayName) }}
        />
      )}

      {entry.isDuplicate && (
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rust"
          title={`Doublon ×${entry.platforms.length}`}
        />
      )}

      {status && STATUS_DOT[status] && (
        <span
          className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${STATUS_DOT[status]}`}
          title={GAME_STATUS_LABELS[status]}
        />
      )}

      {/* Title stays visible at rest — a plain color tile (missing cover
          art) would otherwise be unidentifiable until hovered. The second
          line (playtime/rating) is the only part gated behind hover, to
          keep the tile calm when just scanning the grid. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-5 pb-1.5">
        <div className="text-[11px] font-medium text-white truncate">
          {favorite && "★ "}
          {entry.displayName}
        </div>
        <div className="text-[10px] text-white/60 max-h-0 opacity-0 overflow-hidden transition-all duration-200 ease-out group-hover:max-h-4 group-hover:opacity-100 group-focus-visible:max-h-4 group-focus-visible:opacity-100">
          {entry.platforms.every((p) => p.platform === "gog")
            ? "GOG"
            : formatHours(entry.totalPlaytimeMinutes)}
          {rating ? ` · ★${rating}` : ""}
        </div>
      </div>
    </button>
  );
}
