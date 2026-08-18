"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { LibraryEntry } from "@/types/game";
import { missingClassics, type Classic } from "@/lib/classics";
import { placeholderGradient } from "@/lib/placeholder";

function ClassicCover({
  classic,
  className,
}: {
  classic: Classic;
  className: string;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div
        className={className}
        style={{ background: placeholderGradient(classic.title) }}
      />
    );
  }
  return (
    <Image
      src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${classic.appid}/library_600x900.jpg`}
      alt=""
      fill
      sizes="(min-width: 1024px) 11vw, (min-width: 640px) 18vw, 24vw"
      unoptimized
      onError={() => setBroken(true)}
      className={className}
    />
  );
}

function ClassicTile({
  classic,
  onSelect,
}: {
  classic: Classic;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group relative aspect-[2/3] w-full rounded-sm overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-brass/70"
    >
      <ClassicCover
        classic={classic}
        className="absolute inset-0 object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pt-5 pb-1.5">
        <div className="text-[11px] font-medium text-white truncate">
          {classic.title}
        </div>
      </div>
    </button>
  );
}

function ClassicArticle({
  classic,
  onClose,
}: {
  classic: Classic;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={classic.title}
        className="relative bg-shelf-card border border-shelf-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors"
        >
          ✕
        </button>

        <div className="relative flex gap-4 p-5">
          <div className="relative w-28 flex-shrink-0 aspect-[2/3] rounded-md overflow-hidden shadow-lg shadow-black/50 bg-shelf-surface">
            <ClassicCover classic={classic} className="absolute inset-0 object-cover" />
          </div>
          <div className="min-w-0 pt-1">
            <h2 className="text-xl font-bold tracking-tight text-shelf-text text-balance">
              {classic.title}
            </h2>
            <p className="text-[10px] uppercase tracking-wide text-brass mt-1">
              Pourquoi c&apos;est un classique
            </p>
          </div>
        </div>

        <div className="border-t border-shelf-border p-5 space-y-4">
          <p className="text-shelf-text text-sm leading-relaxed">
            {classic.reason}
          </p>
          <a
            href={`https://store.steampowered.com/app/${classic.appid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-brass text-brass-ink text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brass-hover transition-colors"
          >
            Voir sur Steam →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ClassicsGrid({
  entries,
  limit,
}: {
  entries: LibraryEntry[];
  limit?: number;
}) {
  const [selected, setSelected] = useState<Classic | null>(null);
  const classics = useMemo(
    () => missingClassics(entries.map((e) => e.displayName), limit),
    [entries, limit]
  );

  if (classics.length === 0) {
    return (
      <p className="text-shelf-muted text-sm">
        Tu possèdes déjà tous les classiques de la sélection — bravo.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-8 gap-1">
        {classics.map((c) => (
          <ClassicTile key={c.appid} classic={c} onSelect={() => setSelected(c)} />
        ))}
      </div>
      {selected && (
        <ClassicArticle classic={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
