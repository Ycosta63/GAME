import type { LibraryStats } from "@/types/game";
import { formatHours } from "@/lib/format";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-[#14161b] border border-white/10 rounded-xl px-4 py-3 flex-1 min-w-[140px]">
      <div className="text-white/50 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-white/40 text-xs mt-0.5">{hint}</div>}
    </div>
  );
}

export default function StatsBar({ stats }: { stats: LibraryStats }) {
  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label="Jeux uniques" value={String(stats.uniqueGames)} />
      <StatCard
        label="Total (avec doublons)"
        value={String(stats.totalGames)}
        hint={
          stats.duplicateGroups > 0
            ? `${stats.duplicateGroups} en double`
            : "aucun doublon"
        }
      />
      <StatCard
        label="Temps de jeu total"
        value={formatHours(stats.totalPlaytimeMinutes)}
      />
      <StatCard
        label="Steam"
        value={String(stats.byPlatform.steam.games)}
        hint={formatHours(stats.byPlatform.steam.playtimeMinutes)}
      />
      <StatCard
        label="PlayStation"
        value={String(stats.byPlatform.psn.games)}
        hint={formatHours(stats.byPlatform.psn.playtimeMinutes)}
      />
      <StatCard
        label="Trophées gagnés"
        value={String(stats.totalTrophies)}
        hint={`${stats.totalPlatinums} platine(s)`}
      />
      <StatCard
        label="Jamais joués"
        value={String(stats.neverPlayed)}
      />
    </div>
  );
}
