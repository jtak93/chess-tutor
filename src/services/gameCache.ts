import type { GameReviewReport } from '../types/chess';

const CACHE_PREFIX = 'chess_tutor_game_cache_';
const INDEX_KEY = 'chess_tutor_cached_games_index';

export interface CachedGameMeta {
  cacheKey: string;
  white: string;
  black: string;
  date?: string;
  result: string;
  whiteAccuracy: number;
  blackAccuracy: number;
  movesCount: number;
  cachedAt: number;
}

/**
 * Computes a stable hash key for a given PGN.
 */
export function getPgnCacheKey(pgn: string): string {
  const normalized = pgn.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  let hash = 5381;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return `${CACHE_PREFIX}${Math.abs(hash >>> 0)}`;
}

/**
 * Retrieves a cached GameReviewReport for the given PGN if it exists.
 */
export function getCachedGameReport(pgn: string): GameReviewReport | null {
  try {
    const key = getPgnCacheKey(pgn);
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as GameReviewReport;
  } catch (err) {
    console.warn('Error reading game report from localStorage:', err);
    return null;
  }
}

/**
 * Saves a GameReviewReport to localStorage and updates the cached index.
 */
export function setCachedGameReport(pgn: string, report: GameReviewReport): void {
  try {
    const key = getPgnCacheKey(pgn);
    localStorage.setItem(key, JSON.stringify(report));

    // Update the index of cached games
    const index = getCachedGamesIndex();
    const existingIdx = index.findIndex((i) => i.cacheKey === key);

    const meta: CachedGameMeta = {
      cacheKey: key,
      white: report.metadata.white || 'White',
      black: report.metadata.black || 'Black',
      date: report.metadata.date,
      result: report.metadata.result || '*',
      whiteAccuracy: report.whiteAccuracy,
      blackAccuracy: report.blackAccuracy,
      movesCount: report.moves.length,
      cachedAt: Date.now(),
    };

    if (existingIdx >= 0) {
      index[existingIdx] = meta;
    } else {
      index.unshift(meta);
    }

    localStorage.setItem(INDEX_KEY, JSON.stringify(index.slice(0, 50)));
  } catch (err) {
    console.warn('Error saving game report to localStorage:', err);
  }
}

/**
 * Returns a list of metadata for all currently cached games.
 */
export function getCachedGamesIndex(): CachedGameMeta[] {
  try {
    const item = localStorage.getItem(INDEX_KEY);
    if (!item) return [];
    return JSON.parse(item) as CachedGameMeta[];
  } catch {
    return [];
  }
}

/**
 * Clears all cached game reports from localStorage.
 */
export function clearAllGameCache(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(CACHE_PREFIX) || key === INDEX_KEY)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('Error clearing game cache:', err);
  }
}
