import { readJson, writeJson } from "./store";
import { MAX_FAVORITES, type GameData, type GameDataMap, type GameStatus } from "@/types/game";

const STATUSES: GameStatus[] = ["backlog", "playing", "completed", "abandoned"];

export class TooManyFavoritesError extends Error {
  constructor() {
    super(`Tu as déjà ${MAX_FAVORITES} favoris — retires-en un d'abord.`);
  }
}

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
  if (typeof merged.publicReview === "string" && merged.publicReview.trim()) {
    cleaned.publicReview = merged.publicReview.trim().slice(0, 2000);
  }
  if (merged.favorite) {
    const alreadyFavorited = current[entryKey]?.favorite === true;
    if (!alreadyFavorited) {
      const favoriteCount = Object.entries(current).filter(
        ([key, d]) => key !== entryKey && d.favorite
      ).length;
      if (favoriteCount >= MAX_FAVORITES) {
        throw new TooManyFavoritesError();
      }
    }
    cleaned.favorite = true;
  }

  const next = { ...current };
  if (Object.keys(cleaned).length === 0) {
    delete next[entryKey];
  } else {
    next[entryKey] = { ...cleaned, updatedAt: new Date().toISOString() };
  }
  await writeJson("gamedata", userId, next);
  return next;
}
