"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatsBar from "@/components/StatsBar";
import GameRow from "@/components/GameRow";
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Ta bibliothèque</h1>
          <p className="text-white/50 text-sm mt-1">
            Tous tes jeux Steam et PlayStation, réunis au même endroit.
          </p>
        </div>
        {data && data.entries.length > 0 && (
          <div className="text-right">
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              className="bg-[#14161b] border border-white/10 hover:border-white/30 text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {refreshing ? "Actualisation…" : "↻ Actualiser"}
            </button>
            <div className="text-white/30 text-xs mt-1">
              Synchronisé à{" "}
              {new Date(data.syncedAt).toLocaleTimeString("fr-FR")}
            </div>
          </div>
        )}
      </div>

      {loading && <div className="text-white/50">Chargement…</div>}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {data && data.errors.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg px-4 py-3 text-sm space-y-1">
          {data.errors.map((e) => (
            <div key={e.platform}>
              <strong>{PLATFORM_LABELS[e.platform]}</strong> : {e.message}
            </div>
          ))}
        </div>
      )}

      {notConfigured && (
        <div className="bg-[#14161b] border border-white/10 rounded-xl px-6 py-8 text-center space-y-3">
          <p className="text-white/70">
            Aucun compte connecté pour l&apos;instant.
          </p>
          <Link
            href="/settings"
            className="inline-block bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
          >
            Connecter Steam / PlayStation
          </Link>
        </div>
      )}

      {data && data.entries.length > 0 && (
        <>
          <StatsBar stats={data.stats} />

          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Rechercher un jeu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] outline-none focus:border-white/30"
            />
            <select
              value={platformFilter}
              onChange={(e) =>
                setPlatformFilter(e.target.value as Platform | "all")
              }
              className="bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
            >
              <option value="all">Tous les launchers</option>
              <option value="steam">Steam</option>
              <option value="psn">PlayStation</option>
            </select>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-[#14161b] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
            >
              <option value="playtime">Trier par temps de jeu</option>
              <option value="name">Trier par nom</option>
              <option value="lastPlayed">Trier par dernière session</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-white/70 select-none">
              <input
                type="checkbox"
                checked={duplicatesOnly}
                onChange={(e) => setDuplicatesOnly(e.target.checked)}
              />
              Doublons uniquement
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70 select-none">
              <input
                type="checkbox"
                checked={hideNeverPlayed}
                onChange={(e) => setHideNeverPlayed(e.target.checked)}
              />
              Masquer les jeux jamais joués
            </label>
            <span className="text-white/40 text-xs ml-auto">
              {filteredEntries.length} jeu(x) affiché(s)
            </span>
          </div>

          <div className="space-y-2">
            {filteredEntries.map((entry) => (
              <GameRow key={entry.key} entry={entry} />
            ))}
            {filteredEntries.length === 0 && (
              <div className="text-white/40 text-sm text-center py-8">
                Aucun jeu ne correspond à ces filtres.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
