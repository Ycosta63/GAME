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
      <span className={`text-xl font-bold tracking-tight ${toneClass}`}>
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wide text-shelf-muted">
        {label}
      </span>
    </div>
  );
}

const PLATFORM_BAR_COLORS: Record<string, string> = {
  steam: "#66c0f4",
  psn: "#0070d1",
  gog: "#c98fee",
};

function PlatformBreakdown({ stats }: { stats: LibraryStats }) {
  const total = stats.totalGames;
  if (total === 0) return null;
  const segments = (["steam", "psn", "gog"] as const)
    .map((platform) => ({
      platform,
      count: stats.byPlatform[platform].games,
      pct: (stats.byPlatform[platform].games / total) * 100,
    }))
    .filter((s) => s.count > 0);

  if (segments.length < 2) return null;

  return (
    <div className="w-full max-w-md space-y-1.5">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-shelf-surface">
        {segments.map((s) => (
          <div
            key={s.platform}
            style={{
              width: `${s.pct}%`,
              backgroundColor: PLATFORM_BAR_COLORS[s.platform],
            }}
            title={`${s.platform} : ${s.count} (${Math.round(s.pct)}%)`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-shelf-muted">
        {segments.map((s) => (
          <span key={s.platform} className="inline-flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: PLATFORM_BAR_COLORS[s.platform] }}
            />
            {Math.round(s.pct)}% {s.platform}
          </span>
        ))}
      </div>
    </div>
  );
}

// Purely illustrative — there's no real per-game completion-time data
// (that would need a third-party source like HowLongToBeat), so this is a
// deliberately playful estimate, not a claim of accuracy.
const ASSUMED_HOURS_PER_BACKLOG_GAME = 10;

function BacklogInsight({ stats }: { stats: LibraryStats }) {
  if (stats.neverPlayed === 0) return null;
  const totalHours = stats.neverPlayed * ASSUMED_HOURS_PER_BACKLOG_GAME;
  const days = Math.round(totalHours);
  const years = (days / 365).toFixed(1);
  return (
    <p className="text-xs text-shelf-muted/80">
      À 1h/jour, finir tes {stats.neverPlayed} jeu(x) jamais lancés
      prendrait environ {years} an(s) (en comptant ~
      {ASSUMED_HOURS_PER_BACKLOG_GAME}h par jeu, à la louche).
    </p>
  );
}

export default function StatsBar({ stats }: { stats: LibraryStats }) {
  return (
    <div className="space-y-3 py-4 border-y border-shelf-border">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
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
        <Stat value={String(stats.byPlatform.gog.games)} label="GOG" />
        <Stat value={String(stats.totalTrophies)} label="Trophées" />
        <Stat value={String(stats.neverPlayed)} label="Jamais joués" />
      </div>
      <PlatformBreakdown stats={stats} />
      <BacklogInsight stats={stats} />
    </div>
  );
}
