export type MoveClassification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'miss'
  | 'blunder';

export interface EngineEval {
  type: 'cp' | 'mate';
  value: number; // centipawns (from current player's perspective or White's)
  whiteValue: number; // always from White's perspective (+ = White ahead, - = Black ahead)
  depth: number;
}

export interface EngineLine {
  uci: string;
  san?: string;
  eval: EngineEval;
  pv: string[]; // sequence of UCI moves
  pvSan?: string[]; // sequence of SAN moves
}

export interface MoveAnalysis {
  ply: number; // 0-indexed ply (0 = White 1st move, 1 = Black 1st move)
  moveNumber: number; // 1, 2, 3...
  turn: 'w' | 'b';
  san: string; // e.g. "Nf3"
  uci: string; // e.g. "g1f3"
  from: string; // e.g. "g1"
  to: string; // e.g. "f3"
  piece: string; // 'p', 'n', 'b', 'r', 'q', 'k'
  captured?: string;
  promotion?: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: EngineEval;
  evalAfter: EngineEval;
  winChanceBefore: number; // 0 - 100% (from player's perspective)
  winChanceAfter: number; // 0 - 100% (from player's perspective)
  winChanceDelta: number; // winChanceAfter - winChanceBefore
  bestMove: string; // UCI format e.g. "e2e4"
  bestMoveSan: string; // SAN format e.g. "e4"
  bestLine?: string[]; // UCI sequence
  bestLineSan?: string[]; // SAN sequence
  alternativeLines?: EngineLine[]; // MultiPV lines
  classification: MoveClassification;
  openingName?: string;
  coachComment?: string;
  isSacrifice?: boolean;
  threats?: string[];
  keyMoment?: boolean;
}

export interface GameMetadata {
  event?: string;
  site?: string;
  date?: string;
  white: string;
  black: string;
  whiteElo?: string;
  blackElo?: string;
  result: string; // "1-0", "0-1", "1/2-1/2", "*"
  eco?: string;
  opening?: string;
}

export interface GameReviewReport {
  metadata: GameMetadata;
  moves: MoveAnalysis[];
  whiteAccuracy: number; // 0 - 100%
  blackAccuracy: number; // 0 - 100%
  whiteEstimatedElo: number; // Estimated performance rating (e.g. 1750)
  blackEstimatedElo: number; // Estimated performance rating (e.g. 1900)
  classificationCounts: {
    w: Record<MoveClassification, number>;
    b: Record<MoveClassification, number>;
  };
  summary: {
    openingSummary: string;
    whiteHighlights: string;
    blackHighlights: string;
    keyTurningPoints: number[]; // ply indices
  };
}

export type CoachPersona = 'grandmaster' | 'strict' | 'friendly' | 'witty';

export interface CoachMessage {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  timestamp: number;
}
