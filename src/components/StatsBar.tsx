import type { LibraryStats } from "@/types/game";
import { formatHours } from "@/lib/format";

function Stat({
  value,
  label,
  tone = "default",
}: {
  value: string;
  label: string;
  tone?: "default" | "warn" | "good";
}) {
  const toneClass =
    tone === "warn" ? "text-rust" : tone === "good" ? "text-sage" : "text-shelf-text";

  return (
    <div className="flex flex-col">
      <span className={`font-display text-xl font-semibold ${toneClass}`}>
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wide text-shelf-muted">
        {label}
      </span>
    </div>
  );
}

export default function StatsBar({ stats }: { stats: LibraryStats }) {
  return (
    <div className="flex flex-wrap items-start gap-x-8 gap-y-4 py-4 border-y border-shelf-border">
      <Stat value={String(stats.uniqueGames)} label="Jeux uniques" />
      <Stat value={String(stats.totalGames)} label="Avec doublons" />
      <Stat
        value={String(stats.duplicateGroups)}
        label="Doublons"
        tone={stats.duplicateGroups > 0 ? "warn" : "good"}
      />
      <Stat
        value={formatHours(stats.totalPlaytimeMinutes)}
        label="Temps de jeu"
      />
      <Stat value={String(stats.byPlatform.steam.games)} label="Steam" />
      <Stat value={String(stats.byPlatform.psn.games)} label="PlayStation" />
      <Stat value={String(stats.totalTrophies)} label="Trophées" />
      <Stat value={String(stats.neverPlayed)} label="Jamais joués" />
    </div>
  );
}
