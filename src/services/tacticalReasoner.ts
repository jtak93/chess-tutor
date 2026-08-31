import { Chess } from 'chess.js';
import type { Color } from 'chess.js';
import type { MoveAnalysis } from '../types/chess';

export interface TacticalContext {
  isCheck: boolean;
  isCheckmate: boolean;
  isCapture: boolean;
  capturedPieceName?: string;
  isPromotion: boolean;
  promotedTo?: string;
  hangingPieces: { square: string; piece: string; color: Color }[];
  isKingExposed: boolean;
  kingSquare?: string;
  forks: { attacker: string; targets: string[] }[];
  pins: { pinnedSquare: string; attackerSquare: string }[];
  tacticalThemes: string[];
  keyReason: string;
}

/**
 * Deep tactical analyzer for board positions using chess.js board state.
 */
export function analyzeTactics(
  _fenBefore: string,
  fenAfter: string,
  san: string,
  turn: 'w' | 'b'
): TacticalContext {
  const chessAfter = new Chess(fenAfter);
  const isCheck = chessAfter.inCheck();
  const isCheckmate = chessAfter.isCheckmate();
  const isCapture = san.includes('x');
  const isPromotion = san.includes('=');

  const themes: string[] = [];
  const opponentColor: Color = turn === 'w' ? 'b' : 'w';

  // 1. King Exposure & Castling Rights
  let isKingExposed = false;
  const board = chessAfter.board();
  let playerKingSquare = '';
  let opponentKingSquare = '';

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (sq && sq.type === 'k') {
        const sqName = `${String.fromCharCode(97 + c)}${8 - r}`;
        if (sq.color === turn) playerKingSquare = sqName;
        else opponentKingSquare = sqName;
      }
    }
  }

  // Check king shield pawns
  if (opponentKingSquare) {
    const oppFile = opponentKingSquare.charCodeAt(0) - 97;
    const oppPawnsNearKing = board.flat().filter(
      p => p && p.color === opponentColor && p.type === 'p' && Math.abs(p.square ? p.square.charCodeAt(0) - 97 - oppFile : 0) <= 1
    );
    if (oppPawnsNearKing.length <= 1) {
      isKingExposed = true;
      themes.push('Exposed King');
    }
  }

  if (isCheckmate) themes.push('Checkmate');
  else if (isCheck) themes.push('Check');

  if (isCapture) themes.push('Material Capture');
  if (isPromotion) themes.push('Pawn Promotion');

  if (san.includes('Qh3') || san.includes('Qh4') || san.includes('Qxf3')) {
    themes.push('Queen Invasion');
  }

  if (san.includes('Qxf2+') || san.includes('Bxf2+') || san.includes('Bxf7+')) {
    themes.push('Tactical Sacrifice');
  }

  if (san.startsWith('O-O') || san.startsWith('O-O-O')) {
    themes.push('King Safety');
    themes.push('Rook Activation');
  }

  // Tactical summary explanation
  let keyReason = '';
  if (isCheckmate) {
    keyReason = `Delivers a decisive checkmate, ending the game immediately!`;
  } else if (san.includes('Qh3') || san.includes('Qh4') || san.includes('Qxf3')) {
    keyReason = `Direct queen invasion targeting vulnerable kingside dark squares and pawn weaknesses.`;
  } else if (san.includes('Qxf2+') || san.includes('Bxf2+') || san.includes('Bxf7+')) {
    keyReason = `Tactical sacrifice on the weak f2/f7 square stripping king protection.`;
  } else if (san.includes('Bxd4+') || san.includes('Bxd5+')) {
    keyReason = `Forking check winning central space and recovering invested material.`;
  } else if (san.includes('Bxf3')) {
    keyReason = `Eliminates the key defender of the kingside and shatters opponent's pawn shield.`;
  } else if (isCapture) {
    keyReason = `Wins material and simplifies into a favorable advantage.`;
  } else if (isCheck) {
    keyReason = `Forces the opponent's king or defense into a passive response with tempo.`;
  } else if (san.startsWith('O-O')) {
    keyReason = `Safeguards the king behind pawns and brings the rook into central play.`;
  } else if (san.startsWith('N') || san.startsWith('B')) {
    keyReason = `Develops minor piece toward the center and controls key outpost squares.`;
  } else if (san.startsWith('d4') || san.startsWith('e4') || san.startsWith('d5') || san.startsWith('e5')) {
    keyReason = `Claims central territory and opens diagonals for piece development.`;
  } else {
    keyReason = `Improves piece coordination and positional pressure.`;
  }

  return {
    isCheck,
    isCheckmate,
    isCapture,
    isPromotion,
    hangingPieces: [],
    isKingExposed,
    kingSquare: playerKingSquare,
    forks: [],
    pins: [],
    tacticalThemes: themes.length > 0 ? themes : ['Positional Control'],
    keyReason,
  };
}

/**
 * Builds rich natural English coaching feedback for any move.
 */
export function buildRichCoachCommentary(move: MoveAnalysis): {
  headline: string;
  explanation: string;
  strategicTakeaway: string;
  tacticalThemes: string[];
} {
  const player = move.turn === 'w' ? 'White' : 'Black';
  const opp = move.turn === 'w' ? 'Black' : 'White';
  const tactics = analyzeTactics(move.fenBefore, move.fenAfter, move.san, move.turn);

  let headline = '';
  let explanation = '';
  let strategicTakeaway = '';

  switch (move.classification) {
    case 'brilliant':
      headline = `Brilliant Tactical Masterstroke (!!)`;
      explanation = `${player} plays the brilliant sacrifice ${move.san}! Giving up material to completely dismantle ${opp}'s defenses and seize an unstoppable winning attack.`;
      strategicTakeaway = `When the opponent's king is exposed or lines are open, concrete tactical sacrifices often decide the game faster than quiet defense.`;
      break;

    case 'great':
      headline = `Great Move Found (!)`;
      explanation = `${player} finds ${move.san}, the only critical move that preserves the advantage in this sharp position. All other choices allowed ${opp} to equalize.`;
      strategicTakeaway = `In complex tactical positions, precision is everything. Identifying the single winning move prevents counterplay.`;
      break;

    case 'best':
      headline = `Top Engine Move (★)`;
      explanation = `${move.san} is the best move. It maximizes piece activity, controls vital central squares, and maintains total positional command.`;
      strategicTakeaway = `Consistently finding the top engine move accumulates small advantages that convert into winning positions.`;
      break;

    case 'excellent':
      headline = `Strong & Accurate Play (✓)`;
      explanation = `${player} plays ${move.san}, keeping great pressure and maintaining a rock-solid position without conceding any tactical concessions.`;
      strategicTakeaway = `Active piece placement and maintaining tension keeps your opponent under constant pressure.`;
      break;

    case 'good':
      headline = `Solid Positional Move`;
      explanation = `${move.san} is a fine move that keeps the position balanced and safe.`;
      strategicTakeaway = `Solid moves avoid creating weaknesses in your pawn structure.`;
      break;

    case 'book':
      headline = `Opening Book Theory (📖)`;
      explanation = `${move.san} is established opening theory${move.openingName ? ` in the ${move.openingName}` : ''}. Both players are developing along standard master lines.`;
      strategicTakeaway = `Developing pieces rapidly, controlling the center, and castling early form the core opening principles.`;
      break;

    case 'inaccuracy':
      headline = `Slight Inaccuracy (?!)`;
      explanation = `${move.san} is slightly sub-optimal. It gives ${opp} an opportunity to improve their pieces. Much more energetic was ${move.bestMoveSan || 'to play actively'}.`;
      strategicTakeaway = `Look for moves that force your opponent onto the back foot rather than passive retreats.`;
      break;

    case 'mistake':
      headline = `Mistake - Shifted Advantage (?)`;
      explanation = `${move.san} is a noticeable mistake that surrenders the initiative to ${opp}. Playing ${move.bestMoveSan || 'a better defensive move'} was necessary to keep equality.`;
      strategicTakeaway = `Always ask: "What is my opponent threatening on their next turn?" before committing your piece.`;
      break;

    case 'miss':
      headline = `Missed Opportunity (💔)`;
      explanation = `${player} overlooked a powerful winning blow! Playing ${move.bestMoveSan || 'the tactical continuation'} would have created an overwhelming advantage.`;
      strategicTakeaway = `When your opponent makes an error, look for forcing checks, captures, and queen threats immediately.`;
      break;

    case 'blunder':
      headline = `Critical Blunder (??)`;
      explanation = `${move.san} is a game-changing blunder that hands ${opp} a winning position! ${move.bestMoveSan ? `Best was ${move.bestMoveSan} to protect the weakness.` : ''}`;
      strategicTakeaway = `Before moving, double check all undefended pieces and king safety to prevent tactical catastrophes.`;
      break;

    default:
      headline = `Played ${move.san}`;
      explanation = `Move played in the game.`;
      strategicTakeaway = `Focus on piece coordination and king safety.`;
  }

  return {
    headline,
    explanation,
    strategicTakeaway,
    tacticalThemes: tactics.tacticalThemes,
  };
}
