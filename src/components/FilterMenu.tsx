"use client";

import { useEffect, useRef } from "react";
import { GAME_STATUS_LABELS, type GameStatus } from "@/types/game";

export default function FilterMenu({
  statusFilter,
  onStatusFilterChange,
  duplicatesOnly,
  onDuplicatesOnlyChange,
  hideNeverPlayed,
  onHideNeverPlayedChange,
  completedOnly,
  onToggleCompletedOnly,
  checkingAchievements,
}: {
  statusFilter: GameStatus | "all";
  onStatusFilterChange: (v: GameStatus | "all") => void;
  duplicatesOnly: boolean;
  onDuplicatesOnlyChange: (v: boolean) => void;
  hideNeverPlayed: boolean;
  onHideNeverPlayedChange: (v: boolean) => void;
  completedOnly: boolean;
  onToggleCompletedOnly: () => void;
  checkingAchievements: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const activeCount =
    (statusFilter !== "all" ? 1 : 0) +
    (duplicatesOnly ? 1 : 0) +
    (hideNeverPlayed ? 1 : 0) +
    (completedOnly ? 1 : 0);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
        detailsRef.current.open = false;
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <details ref={detailsRef} className="relative">
      <summary
        className={`list-none [&::-webkit-details-marker]:hidden cursor-pointer text-sm px-3 py-2 rounded-full border transition-colors ${
          activeCount > 0
            ? "bg-brass/15 text-brass border-brass/40"
            : "bg-transparent text-shelf-muted border-shelf-border hover:text-shelf-text"
        }`}
      >
        Filtres{activeCount > 0 ? ` (${activeCount})` : ""}
      </summary>

      <div className="absolute z-20 mt-2 right-0 w-72 bg-shelf-card border border-shelf-border rounded-xl p-4 space-y-4 shadow-xl shadow-black/40">
        <div className="space-y-1.5">
          <label className="text-xs text-shelf-muted">Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as GameStatus | "all")}
            className="w-full bg-shelf-surface border border-shelf-border rounded-lg px-3 py-2 text-sm text-shelf-text outline-none focus:border-brass/50 cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(GAME_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-shelf-text">Doublons uniquement</span>
          <input
            type="checkbox"
            checked={duplicatesOnly}
            onChange={(e) => onDuplicatesOnlyChange(e.target.checked)}
            className="accent-brass w-4 h-4"
          />
        </label>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-shelf-text">Jamais joués masqués</span>
          <input
            type="checkbox"
            checked={hideNeverPlayed}
            onChange={(e) => onHideNeverPlayedChange(e.target.checked)}
            className="accent-brass w-4 h-4"
          />
        </label>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm text-shelf-text">
            100% terminés{checkingAchievements ? " — vérification…" : ""}
          </span>
          <input
            type="checkbox"
            checked={completedOnly}
            disabled={checkingAchievements}
            onChange={onToggleCompletedOnly}
            className="accent-brass w-4 h-4 disabled:opacity-50"
          />
        </label>
      </div>
    </details>
  );
}
