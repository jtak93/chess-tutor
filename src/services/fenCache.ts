import type { PositionEvaluationResult } from './stockfishPool';

const FEN_CACHE_PREFIX = 'ct_fen_';
const MAX_IN_MEMORY_CACHE = 1000;

// In-memory LRU Map for lightning-fast 0ms hits
const inMemoryFenCache = new Map<string, PositionEvaluationResult>();

/**
 * Normalizes a FEN to strip halfmove clock and fullmove number,
 * so transpositions and identical board setups match across different games.
 */
export function normalizeFen(fen: string): string {
  const parts = fen.trim().split(' ');
  if (parts.length >= 4) {
    // Keep board, active color, castling rights, en passant square
    return `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]}`;
  }
  return fen.trim();
}

/**
 * Retrieves a cached position evaluation by FEN.
 */
export function getCachedFenEval(fen: string, minDepth: number = 10): PositionEvaluationResult | null {
  const key = normalizeFen(fen);

  // 1. Check in-memory cache
  const memHit = inMemoryFenCache.get(key);
  if (memHit && memHit.depth >= minDepth) {
    return memHit;
  }

  // 2. Check localStorage cache
  try {
    const raw = localStorage.getItem(`${FEN_CACHE_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as PositionEvaluationResult;
      if (parsed && parsed.depth >= minDepth) {
        // Promote to in-memory cache
        inMemoryFenCache.set(key, parsed);
        return parsed;
      }
    }
  } catch {
    // Ignore localStorage errors
  }

  return null;
}

/**
 * Stores a position evaluation in the global FEN cache.
 */
export function setCachedFenEval(fen: string, result: PositionEvaluationResult): void {
  const key = normalizeFen(fen);

  // Store in memory
  if (inMemoryFenCache.size >= MAX_IN_MEMORY_CACHE) {
    // Evict oldest entry
    const firstKey = inMemoryFenCache.keys().next().value;
    if (firstKey) inMemoryFenCache.delete(firstKey);
  }
  inMemoryFenCache.set(key, result);

  // Store in localStorage
  try {
    localStorage.setItem(`${FEN_CACHE_PREFIX}${key}`, JSON.stringify(result));
  } catch {
    // Quota exceeded: clean oldest CT fen entries
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(FEN_CACHE_PREFIX)) {
          keysToRemove.push(k);
          if (keysToRemove.length >= 50) break;
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(`${FEN_CACHE_PREFIX}${key}`, JSON.stringify(result));
    } catch {
      // Ignore
    }
  }
}
