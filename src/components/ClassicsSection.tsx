"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { LibraryEntry } from "@/types/game";
import { missingClassics, type Classic } from "@/lib/classics";
import { placeholderGradient } from "@/lib/placeholder";

function ClassicTile({ classic }: { classic: Classic }) {
  const [broken, setBroken] = useState(false);

  return (
    <a
      href={`https://store.steampowered.com/app/${classic.appid}`}
      target="_blank"
      rel="noopener noreferrer"
      title={classic.reason}
      className="group relative aspect-[2/3] w-full rounded-sm overflow-hidden block outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
    >
      {broken ? (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          style={{ background: placeholderGradient(classic.title) }}
        />
      ) : (
        <Image
          src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${classic.appid}/library_600x900.jpg`}
          alt=""
          fill
          sizes="(min-width: 1024px) 11vw, (min-width: 640px) 18vw, 24vw"
          unoptimized
          onError={() => setBroken(true)}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-5 pb-1.5">
        <div className="text-[11px] font-medium text-white truncate">
          {classic.title}
        </div>
        <div className="text-[10px] text-white/70 max-h-0 opacity-0 overflow-hidden transition-all duration-200 ease-out line-clamp-2 group-hover:max-h-8 group-hover:opacity-100 group-focus-visible:max-h-8 group-focus-visible:opacity-100">
          {classic.reason}
        </div>
      </div>
    </a>
  );
}

export default function ClassicsSection({ entries }: { entries: LibraryEntry[] }) {
  const classics = useMemo(
    () => missingClassics(entries.map((e) => e.displayName)),
    [entries]
  );

  if (classics.length === 0) return null;

  return (
    <section className="space-y-3 pt-2 border-t border-shelf-border">
      <div className="pt-4">
        <h2 className="text-sm font-semibold text-shelf-text">
          Classiques à découvrir
        </h2>
        <p className="text-xs text-shelf-muted mt-0.5">
          Une sélection de jeux reconnus que tu ne possèdes pas encore —
          clique pour voir la fiche Steam.
        </p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 gap-1">
        {classics.map((c) => (
          <ClassicTile key={c.appid} classic={c} />
        ))}
      </div>
    </section>
  );
}
