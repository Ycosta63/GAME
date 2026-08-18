import { readJson, writeJson } from "./store";
import type { GameData, GameDataMap, GameStatus } from "@/types/game";

const STATUSES: GameStatus[] = ["backlog", "playing", "completed", "abandoned"];

export async function readGameDataMap(userId: string): Promise<GameDataMap> {
  return readJson<GameDataMap>("gamedata", userId, {});
}

export async function setGameData(
  userId: string,
  entryKey: string,
  patch: Partial<GameData>
): Promise<GameDataMap> {
  const current = await readGameDataMap(userId);
  const merged: GameData = { ...current[entryKey], ...patch };

  const cleaned: GameData = {};
  if (merged.status && STATUSES.includes(merged.status)) {
    cleaned.status = merged.status;
  }
  if (typeof merged.rating === "number" && merged.rating >= 1 && merged.rating <= 5) {
    cleaned.rating = Math.round(merged.rating);
  }
  if (typeof merged.note === "string" && merged.note.trim()) {
    cleaned.note = merged.note.trim().slice(0, 2000);
  }

  const next = { ...current };
  if (Object.keys(cleaned).length === 0) {
    delete next[entryKey];
  } else {
    next[entryKey] = cleaned;
  }
  await writeJson("gamedata", userId, next);
  return next;
}
