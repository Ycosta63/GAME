import type { LibraryStats } from "@/types/game";
import { formatHours } from "@/lib/format";

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" aria-hidden="true">
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ICONS = {
  shelf: "M3 4h14M3 10h14M3 16h14M4 4v14M16 4v14",
  layers: "M10 3l7 4-7 4-7-4 7-4zM3 13l7 4 7-4M3 10.5l0 0",
  clock: "M10 5.5V10l3 2M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z",
  trophy: "M6 4h8v3a4 4 0 0 1-8 0V4zM6 5H3.5A2.5 2.5 0 0 0 6 8M14 5h2.5A2.5 2.5 0 0 1 14 8M9 11v3M7 17h6M8.5 14h3v3h-3z",
  moon: "M16 11.5A6.5 6.5 0 1 1 8.5 4a5.2 5.2 0 0 0 7.5 7.5z",
};

function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: keyof typeof ICONS;
  tone?: "default" | "warn" | "good";
}) {
  const toneClass =
    tone === "warn" ? "text-rust" : tone === "good" ? "text-sage" : "text-brass";

  return (
    <div className="bg-shelf-card border border-shelf-border rounded-xl px-4 py-3 flex-1 min-w-[150px]">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-shelf-muted">
        <span className={toneClass}>
          <Icon path={ICONS[icon]} />
        </span>
        {label}
      </div>
      <div className="font-display text-2xl font-semibold mt-1.5 text-shelf-text">
        {value}
      </div>
      {hint && <div className="text-shelf-muted text-xs mt-0.5">{hint}</div>}
    </div>
  );
}

export default function StatsBar({ stats }: { stats: LibraryStats }) {
  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label="Jeux uniques" value={String(stats.uniqueGames)} icon="shelf" />
      <StatCard
        label="Total (avec doublons)"
        value={String(stats.totalGames)}
        hint={
          stats.duplicateGroups > 0
            ? `${stats.duplicateGroups} en double`
            : "aucun doublon"
        }
        icon="layers"
        tone={stats.duplicateGroups > 0 ? "warn" : "good"}
      />
      <StatCard
        label="Temps de jeu total"
        value={formatHours(stats.totalPlaytimeMinutes)}
        icon="clock"
      />
      <StatCard
        label="Steam"
        value={String(stats.byPlatform.steam.games)}
        hint={formatHours(stats.byPlatform.steam.playtimeMinutes)}
        icon="shelf"
      />
      <StatCard
        label="PlayStation"
        value={String(stats.byPlatform.psn.games)}
        hint={formatHours(stats.byPlatform.psn.playtimeMinutes)}
        icon="shelf"
      />
      <StatCard
        label="Trophées gagnés"
        value={String(stats.totalTrophies)}
        hint={`${stats.totalPlatinums} platine(s)`}
        icon="trophy"
      />
      <StatCard
        label="Jamais joués"
        value={String(stats.neverPlayed)}
        icon="moon"
      />
    </div>
  );
}
