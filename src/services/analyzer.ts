import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { GameMetadata, GameReviewReport, MoveAnalysis, MoveClassification } from '../types/chess';
import { stockfishPool } from './stockfishPool';
import type { PositionEvaluationResult, BatchEvalTask } from './stockfishPool';
import { calculateGameAccuracy, classifyMove, detectSacrifice, estimatePerformanceRating } from './classification';
import { identifyOpening, isBookMove } from './openingBook';
import { buildRichCoachCommentary } from './tacticalReasoner';

export function uciToSan(fen: string, uci: string): string {
  if (!uci || uci.length < 4 || uci === '(none)') return '';
  try {
    const chess = new Chess(fen);
    const from = uci.substring(0, 2) as Square;
    const to = uci.substring(2, 4) as Square;
    const promotion = uci.length > 4 ? uci[4] : undefined;

    const move = chess.move({
      from,
      to,
      promotion,
    });
    return move ? move.san : uci;
  } catch {
    return uci;
  }
}

export function parsePgnMetadata(pgn: string): GameMetadata {
  const metadata: GameMetadata = {
    white: 'White',
    black: 'Black',
    result: '*',
  };

  const lines = pgn.split('\n');
  for (const line of lines) {
    const match = line.match(/^\[([a-zA-Z0-9_]+)\s+"(.*)"\]$/);
    if (match) {
      const key = match[1].toLowerCase();
      const val = match[2];
      if (key === 'white') metadata.white = val;
      if (key === 'black') metadata.black = val;
      if (key === 'whiteelo') metadata.whiteElo = val;
      if (key === 'blackelo') metadata.blackElo = val;
      if (key === 'result') metadata.result = val;
      if (key === 'date') metadata.date = val;
      if (key === 'event') metadata.event = val;
      if (key === 'site') metadata.site = val;
      if (key === 'eco') metadata.eco = val;
      if (key === 'opening') metadata.opening = val;
    }
  }

  return metadata;
}

export async function analyzeGame(
  pgn: string,
  depth: number = 12,
  onProgress?: (progress: number, currentPly: number, totalPlies: number) => void
): Promise<GameReviewReport> {
  const chess = new Chess();
  chess.loadPgn(pgn);

  const history = chess.history({ verbose: true });
  const metadata = parsePgnMetadata(pgn);

  const moveSans = history.map((m) => m.san);
  const openingInfo = identifyOpening(moveSans);
  if (!metadata.opening && openingInfo.name) {
    metadata.opening = openingInfo.name;
  }
  if (!metadata.eco && openingInfo.eco) {
    metadata.eco = openingInfo.eco;
  }

  // 1. Collect all position FENs with Adaptive Depth Scheduling
  const startChess = new Chess();
  const fens: string[] = [startChess.fen()];
  for (const m of history) {
    fens.push(m.after);
  }

  const evalTasks: BatchEvalTask[] = fens.map((fen, idx) => {
    // Starting position or early known opening book moves can use fast depth
    const isBook = idx < 16 && isBookMove(moveSans, idx);
    let targetDepth = depth;

    if (idx === 0) {
      targetDepth = 6;
    } else if (isBook) {
      targetDepth = Math.min(8, depth);
    }

    return {
      fen,
      targetDepth,
    };
  });

  // 2. Evaluate all positions concurrently with Global FEN Cache + Multi-Core Pool
  const evalResults: PositionEvaluationResult[] = await stockfishPool.evaluateBatchParallel(
    evalTasks,
    depth,
    (completed, total) => {
      if (onProgress) {
        const percent = Math.min(100, Math.round((completed / total) * 100));
        onProgress(percent, completed, total - 1);
      }
    }
  );

  // 3. Assemble sequential MoveAnalyses from the parallel evaluations
  const moveAnalyses: MoveAnalysis[] = [];
  const totalMoves = history.length;

  for (let i = 0; i < totalMoves; i++) {
    const move = history[i];
    const turn = move.color;
    const ply = i;
    const moveNumber = Math.floor(i / 2) + 1;

    const prevFen = fens[i];
    const fenAfter = fens[i + 1];

    const prevEvalResult = evalResults[i];
    const currEvalResult = evalResults[i + 1];

    const isBook = isBookMove(moveSans, ply);
    const isSac = detectSacrifice(prevFen, fenAfter, turn);

    const bestUci = prevEvalResult.bestMove || (move.lan || `${move.from}${move.to}`);
    const bestMoveSan = uciToSan(prevFen, bestUci) || move.san;

    const playedUci = move.lan || `${move.from}${move.to}`;

    const classificationResult = classifyMove({
      turn,
      evalBefore: prevEvalResult.eval,
      evalAfter: currEvalResult.eval,
      playedUci,
      bestUci,
      isBook,
      isSacrifice: isSac,
      secondBestEval: prevEvalResult.alternativeLines?.[0]?.eval,
      ply,
    });

    const interimAnalysis: MoveAnalysis = {
      ply,
      moveNumber,
      turn,
      san: move.san,
      uci: playedUci,
      from: move.from,
      to: move.to,
      piece: move.piece,
      captured: move.captured,
      promotion: move.promotion,
      fenBefore: prevFen,
      fenAfter,
      evalBefore: prevEvalResult.eval,
      evalAfter: currEvalResult.eval,
      winChanceBefore: classificationResult.winChanceBefore,
      winChanceAfter: classificationResult.winChanceAfter,
      winChanceDelta: classificationResult.winChanceDelta,
      bestMove: bestUci,
      bestMoveSan,
      bestLine: prevEvalResult.bestLine,
      alternativeLines: prevEvalResult.alternativeLines,
      classification: classificationResult.classification,
      openingName: isBook ? openingInfo.name : undefined,
      isSacrifice: isSac,
      keyMoment: classificationResult.keyMoment,
    };

    const richCommentary = buildRichCoachCommentary(interimAnalysis);
    interimAnalysis.coachComment = richCommentary.explanation;

    moveAnalyses.push(interimAnalysis);
  }

  // 4. Calculate CAPS2 Game Accuracies & Performance Ratings
  const accuracies = calculateGameAccuracy(
    moveAnalyses.map((m) => ({
      turn: m.turn,
      delta: m.winChanceDelta,
      classification: m.classification,
    }))
  );

  const defaultCounts: Record<MoveClassification, number> = {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    miss: 0,
    blunder: 0,
  };

  const classificationCounts = {
    w: { ...defaultCounts },
    b: { ...defaultCounts },
  };

  const keyTurningPoints: number[] = [];

  for (const m of moveAnalyses) {
    classificationCounts[m.turn][m.classification]++;
    if (m.keyMoment) {
      keyTurningPoints.push(m.ply);
    }
  }

  const whiteEstimatedElo = estimatePerformanceRating(
    accuracies.whiteAccuracy,
    classificationCounts.w.blunder,
    classificationCounts.w.brilliant
  );

  const blackEstimatedElo = estimatePerformanceRating(
    accuracies.blackAccuracy,
    classificationCounts.b.blunder,
    classificationCounts.b.brilliant
  );

  const whiteHighlights = `White played with ${accuracies.whiteAccuracy}% accuracy (~${whiteEstimatedElo} ELO performance). ${classificationCounts.w.best + classificationCounts.w.excellent} best/excellent moves, ${classificationCounts.w.blunder} blunders.`;
  const blackHighlights = `Black played with ${accuracies.blackAccuracy}% accuracy (~${blackEstimatedElo} ELO performance). ${classificationCounts.b.best + classificationCounts.b.excellent} best/excellent moves, ${classificationCounts.b.brilliant} brilliant, ${classificationCounts.b.blunder} blunders.`;

  return {
    metadata,
    moves: moveAnalyses,
    whiteAccuracy: accuracies.whiteAccuracy,
    blackAccuracy: accuracies.blackAccuracy,
    whiteEstimatedElo,
    blackEstimatedElo,
    classificationCounts,
    summary: {
      openingSummary: `The game started with the ${openingInfo.name} (ECO ${openingInfo.eco}).`,
      whiteHighlights,
      blackHighlights,
      keyTurningPoints,
    },
  };
}
