"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { AchievementDetails, LibraryEntry } from "@/types/game";
import PlatformBadge from "./PlatformBadge";
import { formatDate, formatHours } from "@/lib/format";
import { placeholderGradient } from "@/lib/placeholder";

function TrophyLine({
  platinum,
  gold,
  silver,
  bronze,
}: {
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-shelf-muted">
      {platinum > 0 && <span title="Platine">🏆 {platinum}</span>}
      {gold > 0 && <span title="Or">🥇 {gold}</span>}
      {silver > 0 && <span title="Argent">🥈 {silver}</span>}
      {bronze > 0 && <span title="Bronze">🥉 {bronze}</span>}
    </div>
  );
}

export default function GameDetailModal({
  entry,
  onClose,
}: {
  entry: LibraryEntry;
  onClose: () => void;
}) {
  const [achievements, setAchievements] = useState<
    Record<string, AchievementDetails | null | "loading" | { error: string }>
  >({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function loadAchievements(appId: string) {
    setAchievements((prev) => ({ ...prev, [appId]: "loading" }));
    try {
      const res = await fetch(`/api/steam/achievements/${appId}`);
      const data = await res.json();
      if (!res.ok) {
        setAchievements((prev) => ({
          ...prev,
          [appId]: { error: data.error ?? "Erreur inconnue" },
        }));
        return;
      }
      setAchievements((prev) => ({
        ...prev,
        [appId]: data.summary ? data : null,
      }));
    } catch {
      setAchievements((prev) => ({
        ...prev,
        [appId]: { error: "Impossible de contacter le serveur" },
      }));
    }
  }

  const cover = entry.platforms.find((p) => p.coverUrl)?.coverUrl;

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
        aria-label={entry.displayName}
        className="relative bg-shelf-card border border-shelf-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 text-white/80 hover:text-white w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors"
        >
          ✕
        </button>

        <div className="relative overflow-hidden rounded-t-xl">
          <div className="absolute inset-0">
            {cover ? (
              <Image
                src={cover}
                alt=""
                fill
                unoptimized
                className="object-cover scale-110 blur-2xl opacity-40"
              />
            ) : (
              <div
                className="w-full h-full"
                style={{ background: placeholderGradient(entry.displayName) }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-shelf-card/20 via-shelf-card/80 to-shelf-card" />
          </div>

          <div className="relative flex gap-4 p-5">
            <div className="relative w-28 flex-shrink-0 aspect-[2/3] rounded-md overflow-hidden shadow-lg shadow-black/50 bg-shelf-surface">
              {cover ? (
                <Image src={cover} alt="" fill unoptimized className="object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center p-2"
                  style={{ background: placeholderGradient(entry.displayName) }}
                >
                  <span className="font-semibold text-shelf-text/80 text-xs text-center leading-snug line-clamp-5">
                    {entry.displayName}
                  </span>
                </div>
              )}
            </div>
            <div className="min-w-0 pt-1">
              <h2 className="text-xl font-bold tracking-tight text-shelf-text text-balance">
                {entry.displayName}
              </h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {entry.platforms.map((p) => (
                  <PlatformBadge key={p.platform} platform={p.platform} />
                ))}
                {entry.isDuplicate && (
                  <span className="text-[10px] uppercase tracking-wide text-rust border border-rust/40 rounded-full px-2 py-0.5">
                    Doublon
                  </span>
                )}
              </div>
              <div className="text-shelf-muted text-sm mt-2">
                {entry.platforms.every((p) => p.platform === "gog")
                  ? "Temps de jeu non disponible"
                  : `${formatHours(entry.totalPlaytimeMinutes)} au total`}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-shelf-border divide-y divide-shelf-border">
          {entry.platforms.map((p) => (
            <div key={`${p.platform}-${p.id}`} className="p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <PlatformBadge platform={p.platform} />
                  <span className="text-shelf-text text-sm truncate">
                    {p.name}
                  </span>
                </div>
                <span className="text-shelf-text text-sm font-medium flex-shrink-0">
                  {p.platform === "gog" ? "—" : formatHours(p.playtimeMinutes)}
                </span>
              </div>
              <div className="text-xs text-shelf-muted">
                {p.platform === "gog"
                  ? "Temps de jeu non disponible via l'API GOG"
                  : `Dernière session : ${formatDate(p.lastPlayed)}`}
              </div>

              {p.platform === "psn" && p.trophies && (
                <TrophyLine {...p.trophies} />
              )}

              {p.platform === "steam" &&
                (achievements[p.id] === undefined ? (
                  <button
                    className="text-xs underline text-shelf-muted hover:text-brass transition-colors"
                    onClick={() => loadAchievements(p.id)}
                  >
                    Voir les succès
                  </button>
                ) : achievements[p.id] === "loading" ? (
                  <span className="text-xs text-shelf-muted">
                    Chargement…
                  </span>
                ) : achievements[p.id] === null ? (
                  <span className="text-xs text-shelf-muted">
                    Pas de succès
                  </span>
                ) : "error" in (achievements[p.id] as object) ? (
                  <div className="text-xs space-y-0.5">
                    <p className="text-rust break-words">
                      {(achievements[p.id] as { error: string }).error}
                    </p>
                    <button
                      className="underline text-shelf-muted hover:text-brass transition-colors"
                      onClick={() => loadAchievements(p.id)}
                    >
                      Réessayer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      className="text-xs text-shelf-muted hover:text-brass transition-colors"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [p.id]: !prev[p.id],
                        }))
                      }
                    >
                      🏅{" "}
                      {(achievements[p.id] as AchievementDetails).summary.unlocked}/
                      {(achievements[p.id] as AchievementDetails).summary.total} (
                      {
                        (achievements[p.id] as AchievementDetails).summary
                          .progressPercent
                      }
                      %) — {expanded[p.id] ? "masquer" : "voir la liste"}
                    </button>
                    {expanded[p.id] && (
                      <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {(achievements[p.id] as AchievementDetails).list.map(
                          (a) => (
                            <li
                              key={a.apiName}
                              className={`flex items-center gap-2.5 text-xs ${
                                a.achieved
                                  ? "text-shelf-text"
                                  : "text-shelf-muted opacity-60"
                              }`}
                            >
                              {a.icon ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={a.icon}
                                  alt=""
                                  className="w-8 h-8 rounded flex-shrink-0 bg-shelf-surface"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded flex-shrink-0 bg-shelf-surface" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {a.name}
                                </p>
                                {a.description && (
                                  <p className="truncate text-shelf-muted/80">
                                    {a.description}
                                  </p>
                                )}
                              </div>
                              {a.rarityPercent !== undefined && (
                                <span className="flex-shrink-0 text-shelf-muted/70 tabular-nums">
                                  {a.rarityPercent.toFixed(1)}%
                                </span>
                              )}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
