"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatsBar from "@/components/StatsBar";
import GameCard from "@/components/GameCard";
import GameDetailModal from "@/components/GameDetailModal";
import ShelfieMark from "@/components/ShelfieMark";
import LibrarySkeleton from "@/components/LibrarySkeleton";
import type { LibraryEntry, LibraryResponse, Platform } from "@/types/game";

const PLATFORM_LABELS: Record<Platform, string> = {
  steam: "Steam",
  psn: "PlayStation",
};

type SortMode = "playtime" | "name" | "lastPlayed";

function latestPlayedTime(entry: LibraryEntry): number {
  let latest = -Infinity;
  for (const p of entry.platforms) {
    if (p.lastPlayed) {
      const t = new Date(p.lastPlayed).getTime();
      if (!Number.isNaN(t) && t > latest) latest = t;
    }
  }
  return latest;
}

export default function DashboardPage() {
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);
  const [hideNeverPlayed, setHideNeverPlayed] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("playtime");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const load = useCallback((force: boolean) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);
    fetch(force ? "/api/library?force=1" : "/api/library")
      .then((res) => res.json())
      .then((json: LibraryResponse) => setData(json))
      .catch(() => setError("Impossible de charger la bibliothèque."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    const filtered = data.entries.filter((entry) => {
      if (
        search.trim() &&
        !entry.displayName.toLowerCase().includes(search.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        platformFilter !== "all" &&
        !entry.platforms.some((p) => p.platform === platformFilter)
      ) {
        return false;
      }
      if (duplicatesOnly && !entry.isDuplicate) {
        return false;
      }
      if (hideNeverPlayed && entry.totalPlaytimeMinutes === 0) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered];
    if (sortMode === "name") {
      sorted.sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
    } else if (sortMode === "lastPlayed") {
      sorted.sort((a, b) => latestPlayedTime(b) - latestPlayedTime(a));
    } else {
      sorted.sort((a, b) => b.totalPlaytimeMinutes - a.totalPlaytimeMinutes);
    }
    return sorted;
  }, [data, search, platformFilter, duplicatesOnly, hideNeverPlayed, sortMode]);

  const notConfigured =
    data && data.entries.length === 0 && data.errors.length === 0;

  const selectedEntry = selectedKey
    ? data?.entries.find((e) => e.key === selectedKey) ?? null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-shelf-text">
            Ta bibliothèque
          </h1>
          <p className="text-shelf-muted text-sm mt-1">
            Tous tes jeux Steam et PlayStation, réunis au même endroit.
          </p>
        </div>
        {data && data.entries.length > 0 && (
          <div className="text-right">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="bg-shelf-card border border-shelf-border hover:border-brass/50 text-shelf-text text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {refreshing ? "Actualisation…" : "↻ Actualiser"}
            </button>
            <div className="text-shelf-muted/70 text-xs mt-1">
              Synchronisé à{" "}
              {new Date(data.syncedAt).toLocaleTimeString("fr-FR")}
            </div>
          </div>
        )}
      </div>

      {loading && <LibrarySkeleton />}
      {error && (
        <div className="bg-rust/10 border border-rust/30 text-rust rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {data && data.errors.length > 0 && (
        <div className="bg-rust/10 border border-rust/30 text-rust rounded-lg px-4 py-3 text-sm space-y-1">
          {data.errors.map((e) => (
            <div key={e.platform}>
              <strong>{PLATFORM_LABELS[e.platform]}</strong> : {e.message}
            </div>
          ))}
        </div>
      )}

      {notConfigured && (
        <div className="bg-shelf-card border border-shelf-border rounded-xl px-6 py-10 text-center space-y-4">
          <div className="text-brass/60 flex justify-center">
            <ShelfieMark className="w-14 h-11" />
          </div>
          <p className="text-shelf-muted">
            Aucun compte connecté pour l&apos;instant.
          </p>
          <Link
            href="/settings"
            className="inline-block bg-brass text-brass-ink text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brass-hover transition-colors"
          >
            Connecter Steam / PlayStation
          </Link>
        </div>
      )}

      {data && data.entries.length > 0 && (
        <>
          <StatsBar stats={data.stats} />

          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <svg
                viewBox="0 0 20 20"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-shelf-muted pointer-events-none"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                <path d="M17 17l-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un jeu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-shelf-card border border-shelf-border rounded-full pl-9 pr-3 py-2 text-sm text-shelf-text outline-none focus:border-brass/50"
              />
            </div>

            <select
              value={platformFilter}
              onChange={(e) =>
                setPlatformFilter(e.target.value as Platform | "all")
              }
              className="bg-transparent border border-shelf-border rounded-full px-3 py-2 text-sm text-shelf-muted outline-none focus:border-brass/50 hover:text-shelf-text cursor-pointer transition-colors"
            >
              <option value="all">Tous les launchers</option>
              <option value="steam">Steam</option>
              <option value="psn">PlayStation</option>
            </select>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-transparent border border-shelf-border rounded-full px-3 py-2 text-sm text-shelf-muted outline-none focus:border-brass/50 hover:text-shelf-text cursor-pointer transition-colors"
            >
              <option value="playtime">Trier : temps de jeu</option>
              <option value="name">Trier : nom</option>
              <option value="lastPlayed">Trier : dernière session</option>
            </select>

            <button
              onClick={() => setDuplicatesOnly((v) => !v)}
              className={`text-sm px-3 py-2 rounded-full border transition-colors ${
                duplicatesOnly
                  ? "bg-brass/15 text-brass border-brass/40"
                  : "bg-transparent text-shelf-muted border-shelf-border hover:text-shelf-text"
              }`}
            >
              Doublons uniquement
            </button>
            <button
              onClick={() => setHideNeverPlayed((v) => !v)}
              className={`text-sm px-3 py-2 rounded-full border transition-colors ${
                hideNeverPlayed
                  ? "bg-brass/15 text-brass border-brass/40"
                  : "bg-transparent text-shelf-muted border-shelf-border hover:text-shelf-text"
              }`}
            >
              Jamais joués masqués
            </button>

            <span className="text-shelf-muted/70 text-xs ml-auto">
              {filteredEntries.length} jeu(x) affiché(s)
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-1">
            {filteredEntries.map((entry) => (
              <GameCard
                key={entry.key}
                entry={entry}
                onSelect={() => setSelectedKey(entry.key)}
              />
            ))}
          </div>
          {filteredEntries.length === 0 && (
            <div className="text-shelf-muted text-sm text-center py-8">
              Aucun jeu ne correspond à ces filtres.
            </div>
          )}
        </>
      )}

      {selectedEntry && (
        <GameDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  );
}
