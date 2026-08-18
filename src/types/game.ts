export type Platform = "steam" | "psn" | "gog";

export interface RawGame {
  platform: Platform;
  id: string;
  name: string;
  playtimeMinutes: number;
  coverUrl?: string;
  lastPlayed?: string | null;
  trophies?: TrophySummary | null;
  achievements?: AchievementSummary | null;
}

export interface TrophySummary {
  platinum: number;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  earned: number;
  progressPercent: number;
}

export interface AchievementSummary {
  total: number;
  unlocked: number;
  progressPercent: number;
}

export interface AchievementDetail {
  apiName: string;
  name: string;
  description?: string;
  achieved: boolean;
  unlockTime: string | null;
  icon: string;
  /** % of all players who have this achievement (global Steam stat), when available. */
  rarityPercent?: number;
}

export interface AchievementDetails {
  summary: AchievementSummary;
  list: AchievementDetail[];
}

export interface LibraryEntry {
  key: string;
  displayName: string;
  totalPlaytimeMinutes: number;
  platforms: RawGame[];
  isDuplicate: boolean;
}

export interface LibraryStats {
  totalGames: number;
  uniqueGames: number;
  duplicateGroups: number;
  totalPlaytimeMinutes: number;
  byPlatform: Record<Platform, { games: number; playtimeMinutes: number }>;
  totalTrophies: number;
  totalPlatinums: number;
  neverPlayed: number;
}

export type GameStatus = "backlog" | "playing" | "completed" | "abandoned";

export interface GameData {
  status?: GameStatus;
  rating?: number;
  note?: string;
}

export type GameDataMap = Record<string, GameData>;

export interface LibraryResponse {
  entries: LibraryEntry[];
  stats: LibraryStats;
  errors: { platform: Platform; message: string }[];
  syncedAt: string;
}
