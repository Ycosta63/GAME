"use client";

import { useState } from "react";
import type { AchievementSummary, LibraryEntry } from "@/types/game";
import PlatformBadge from "./PlatformBadge";
import { formatDate, formatHours } from "@/lib/format";

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

export default function GameRow({ entry }: { entry: LibraryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [iconFailed, setIconFailed] = useState(false);
  const [achievements, setAchievements] = useState<
    Record<string, AchievementSummary | null | "loading">
  >({});

  const primaryIcon = entry.platforms.find((p) => p.iconUrl)?.iconUrl;

  async function loadAchievements(appId: string) {
    setAchievements((prev) => ({ ...prev, [appId]: "loading" }));
    try {
      const res = await fetch(`/api/steam/achievements/${appId}`);
      const data = await res.json();
      setAchievements((prev) => ({ ...prev, [appId]: data.summary ?? null }));
    } catch {
      setAchievements((prev) => ({ ...prev, [appId]: null }));
    }
  }

  return (
    <div
      className={`bg-shelf-card border rounded-xl p-3 transition-colors ${
        entry.isDuplicate ? "border-rust/50" : "border-shelf-border"
      }`}
    >
      <button
        className="w-full flex items-center gap-3 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        {primaryIcon && !iconFailed ? (
          <img
            src={primaryIcon}
            alt=""
            onError={() => setIconFailed(true)}
            className="w-10 h-10 rounded object-cover bg-shelf-surface flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-shelf-surface flex-shrink-0 flex items-center justify-center text-shelf-muted">
            ?
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate text-shelf-text">
              {entry.displayName}
            </span>
            {entry.isDuplicate && (
              <span className="text-[10px] uppercase tracking-wide text-rust border border-rust/40 rounded-full px-2 py-0.5">
                Doublon ×{entry.platforms.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {entry.platforms.map((p) => (
              <PlatformBadge key={p.platform} platform={p.platform} />
            ))}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-medium text-shelf-text">
            {formatHours(entry.totalPlaytimeMinutes)}
          </div>
          <div className="text-shelf-muted text-xs">{expanded ? "▲" : "▼"}</div>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-shelf-border space-y-2">
          {entry.platforms.map((p) => (
            <div
              key={`${p.platform}-${p.id}`}
              className="flex items-center justify-between text-sm gap-3"
            >
              <div className="flex items-center gap-2">
                <PlatformBadge platform={p.platform} />
                <span className="text-shelf-muted text-xs">{p.name}</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-shelf-muted">
                <span className="text-shelf-text">
                  {formatHours(p.playtimeMinutes)}
                </span>
                <span>Dernière session : {formatDate(p.lastPlayed)}</span>

                {p.platform === "psn" && p.trophies && (
                  <TrophyLine {...p.trophies} />
                )}

                {p.platform === "steam" &&
                  (achievements[p.id] === undefined ? (
                    <button
                      className="underline text-shelf-muted hover:text-brass"
                      onClick={() => loadAchievements(p.id)}
                    >
                      Voir les succès
                    </button>
                  ) : achievements[p.id] === "loading" ? (
                    <span>Chargement…</span>
                  ) : achievements[p.id] === null ? (
                    <span>Pas de succès</span>
                  ) : (
                    <span>
                      🏅 {(achievements[p.id] as AchievementSummary).unlocked}/
                      {(achievements[p.id] as AchievementSummary).total} (
                      {(achievements[p.id] as AchievementSummary).progressPercent}
                      %)
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
