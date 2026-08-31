import type { EngineEval, MoveClassification } from '../types/chess';
import { Chess } from 'chess.js';

/**
 * Converts centipawns or mate evaluation to winning probability (0% - 100%)
 * from White's perspective using standard logistic sigmoid model.
 */
export function evalToWinChance(evaluation: EngineEval): number {
  if (evaluation.type === 'mate') {
    const mateIn = evaluation.whiteValue;
    if (mateIn > 0) {
      return Math.max(99.9, 100 - mateIn * 0.1);
    } else {
      return Math.min(0.1, Math.abs(mateIn) * 0.1);
    }
  }

  const cp = evaluation.whiteValue;
  // Standard sigmoid win-probability model
  const winChance = 100 / (1 + Math.pow(10, -cp / 400));
  return Math.min(99.9, Math.max(0.1, winChance));
}

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 300,
  b: 320,
  r: 500,
  q: 900,
  k: 10000,
};

export function getMaterialBalance(chess: Chess): number {
  let balance = 0;
  const board = chess.board();
  for (const row of board) {
    for (const square of row) {
      if (square) {
        const val = PIECE_VALUES[square.type] || 0;
        balance += square.color === 'w' ? val : -val;
      }
    }
  }
  return balance;
}

export function detectSacrifice(
  fenBefore: string,
  fenAfter: string,
  turn: 'w' | 'b'
): boolean {
  try {
    const chessBefore = new Chess(fenBefore);
    const chessAfter = new Chess(fenAfter);

    const matBefore = getMaterialBalance(chessBefore);
    const matAfter = getMaterialBalance(chessAfter);

    const materialDelta = turn === 'w' ? (matAfter - matBefore) : (matBefore - matAfter);

    if (materialDelta <= -200) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function classifyMove(params: {
  turn: 'w' | 'b';
  evalBefore: EngineEval;
  evalAfter: EngineEval;
  playedUci: string;
  bestUci: string;
  isBook: boolean;
  isSacrifice: boolean;
  secondBestEval?: EngineEval;
  ply: number;
}): {
  classification: MoveClassification;
  winChanceBefore: number;
  winChanceAfter: number;
  winChanceDelta: number;
  keyMoment: boolean;
} {
  const {
    turn,
    evalBefore,
    evalAfter,
    playedUci,
    bestUci,
    isBook,
    isSacrifice,
    secondBestEval,
  } = params;

  const wBefore = evalToWinChance(evalBefore);
  const wAfter = evalToWinChance(evalAfter);

  const playerWinBefore = turn === 'w' ? wBefore : (100 - wBefore);
  const playerWinAfter = turn === 'w' ? wAfter : (100 - wAfter);

  const isBestEngineMove =
    playedUci.toLowerCase().substring(0, 4) === bestUci.toLowerCase().substring(0, 4);

  const winChanceDelta = isBestEngineMove
    ? Math.max(0, playerWinAfter - playerWinBefore)
    : (playerWinAfter - playerWinBefore);

  const winLoss = isBestEngineMove ? 0 : Math.max(0, -winChanceDelta);

  let classification: MoveClassification = 'good';
  let keyMoment = false;

  // 1. Book move
  if (isBook && params.ply < 24) {
    return {
      classification: 'book',
      winChanceBefore: playerWinBefore,
      winChanceAfter: playerWinAfter,
      winChanceDelta: 0,
      keyMoment: false,
    };
  }

  // 2. Brilliant move (!!) - sound piece sacrifice that maintains decisive or equal advantage
  if (isSacrifice && (isBestEngineMove || winLoss <= 2.0) && playerWinAfter >= 45) {
    return {
      classification: 'brilliant',
      winChanceBefore: playerWinBefore,
      winChanceAfter: playerWinAfter,
      winChanceDelta: isBestEngineMove ? 0 : winChanceDelta,
      keyMoment: true,
    };
  }

  // 3. Great move (!) - only winning/saving move
  if (isBestEngineMove && secondBestEval) {
    const secondWin = turn === 'w' ? evalToWinChance(secondBestEval) : (100 - evalToWinChance(secondBestEval));
    const secondDelta = secondWin - playerWinBefore;
    if (secondDelta <= -15.0) {
      return {
        classification: 'great',
        winChanceBefore: playerWinBefore,
        winChanceAfter: playerWinAfter,
        winChanceDelta: 0,
        keyMoment: true,
      };
    }
  }

  // 4. Missed Win / Miss (💔)
  if (playerWinBefore >= 75.0 && winLoss >= 18.0 && playerWinAfter < 60.0) {
    return {
      classification: 'miss',
      winChanceBefore: playerWinBefore,
      winChanceAfter: playerWinAfter,
      winChanceDelta,
      keyMoment: true,
    };
  }

  // 5. Blunder (??)
  if (winLoss >= 25.0 || (evalAfter.type === 'mate' && evalBefore.type !== 'mate' && playerWinAfter < 15)) {
    return {
      classification: 'blunder',
      winChanceBefore: playerWinBefore,
      winChanceAfter: playerWinAfter,
      winChanceDelta,
      keyMoment: true,
    };
  }

  // 6. Mistake (?)
  if (winLoss >= 12.0) {
    return {
      classification: 'mistake',
      winChanceBefore: playerWinBefore,
      winChanceAfter: playerWinAfter,
      winChanceDelta,
      keyMoment: true,
    };
  }

  // 7. Inaccuracy (?!)
  if (winLoss >= 6.0) {
    return {
      classification: 'inaccuracy',
      winChanceBefore: playerWinBefore,
      winChanceAfter: playerWinAfter,
      winChanceDelta,
      keyMoment: false,
    };
  }

  // 8. Best / Excellent / Good
  if (isBestEngineMove || winLoss < 1.0) {
    classification = 'best';
  } else if (winLoss < 3.5) {
    classification = 'excellent';
  } else {
    classification = 'good';
  }

  return {
    classification,
    winChanceBefore: playerWinBefore,
    winChanceAfter: playerWinAfter,
    winChanceDelta,
    keyMoment,
  };
}

/**
 * Computes official CAPS2 (Computer Aggregated Precision Score) Accuracy for White and Black.
 */
export function calculateGameAccuracy(
  moveDeltas: { turn: 'w' | 'b'; delta: number; classification: MoveClassification }[]
): { whiteAccuracy: number; blackAccuracy: number } {
  const whiteMoves = moveDeltas.filter(m => m.turn === 'w');
  const blackMoves = moveDeltas.filter(m => m.turn === 'b');

  function calculatePlayerAccuracy(moves: typeof moveDeltas): number {
    if (moves.length === 0) return 100;

    let totalScore = 0;
    for (const m of moves) {
      if (m.classification === 'book' || m.classification === 'brilliant' || m.classification === 'great' || m.classification === 'best') {
        totalScore += 100;
        continue;
      }

      if (m.classification === 'excellent') {
        totalScore += 97.5;
        continue;
      }

      const winLoss = Math.abs(Math.min(0, m.delta));
      const moveScore = 103.1668 * Math.exp(-0.04354 * winLoss) - 3.1669;
      totalScore += Math.max(0, Math.min(100, moveScore));
    }

    const rawAvg = totalScore / moves.length;
    return Math.min(100, Math.max(10, Math.round(rawAvg * 10) / 10));
  }

  return {
    whiteAccuracy: calculatePlayerAccuracy(whiteMoves),
    blackAccuracy: calculatePlayerAccuracy(blackMoves),
  };
}

/**
 * Estimates performance rating (ELO) based on CAPS2 accuracy, blunders, and brilliancies.
 */
export function estimatePerformanceRating(
  accuracy: number,
  blundersCount: number = 0,
  brilliantCount: number = 0
): number {
  let estimated = 0;
  if (accuracy >= 98) {
    estimated = 2650 + (accuracy - 98) * 100;
  } else if (accuracy >= 94) {
    estimated = 2250 + ((accuracy - 94) / 4) * 400;
  } else if (accuracy >= 85) {
    estimated = 1650 + ((accuracy - 85) / 9) * 600;
  } else if (accuracy >= 75) {
    estimated = 1250 + ((accuracy - 75) / 10) * 400;
  } else if (accuracy >= 60) {
    estimated = 850 + ((accuracy - 60) / 15) * 400;
  } else {
    estimated = Math.max(400, 400 + (accuracy / 60) * 450);
  }

  estimated -= blundersCount * 45;
  estimated += brilliantCount * 55;

  return Math.max(400, Math.min(2950, Math.round(estimated / 25) * 25));
}
