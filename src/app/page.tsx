"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StatsBar from "@/components/StatsBar";
import GameRow from "@/components/GameRow";
import type { LibraryResponse, Platform } from "@/types/game";

const PLATFORM_LABELS: Record<Platform, string> = {
  steam: "Steam",
  psn: "PlayStation",
};

export default function DashboardPage() {
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [duplicatesOnly, setDuplicatesOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/library")
      .then((res) => res.json())
      .then((json: LibraryResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de charger la bibliothèque.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    return data.entries.filter((entry) => {
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
      return true;
    });
  }, [data, search, platformFilter, duplicatesOnly]);

  const notConfigured =
    data && data.entries.length === 0 && data.errors.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ta bibliothèque</h1>
        <p className="text-white/50 text-sm mt-1">
          Tous tes jeux Steam et PlayStation, réunis au même endroit.
        </p>
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
            <label className="flex items-center gap-2 text-sm text-white/70 select-none">
              <input
                type="checkbox"
                checked={duplicatesOnly}
                onChange={(e) => setDuplicatesOnly(e.target.checked)}
              />
              Doublons uniquement
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
