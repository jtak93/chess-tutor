import React, { useEffect, useState, useMemo } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Arrow, PieceDropHandlerArgs } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { MoveAnalysis, MoveClassification } from '../types/chess';
import { CLASSIFICATION_CONFIG } from './BadgeIcon';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
  GitBranch,
  X,
} from 'lucide-react';
import { soundService } from '../services/soundService';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface ChessboardAreaProps {
  currentMove: MoveAnalysis | null;
  fen: string;
  orientation: 'white' | 'black';
  onFlipBoard: () => void;
  showEngineArrow?: boolean;
  onMovePlayed?: (uci: string) => void;
  isRetryMode?: boolean;
  onExitRetryMode?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  // Live Variation & Studio Props
  isLiveMode?: boolean;
  isVariationActive?: boolean;
  variationMoves?: string[];
  onExitVariation?: () => void;
  liveCandidateArrows?: Arrow[];
  onPieceDropAction?: (source: Square, target: Square, promotion?: string) => boolean;
}

export const ChessboardArea: React.FC<ChessboardAreaProps> = ({
  currentMove,
  fen,
  orientation,
  onFlipBoard,
  showEngineArrow = true,
  isRetryMode = false,
  onExitRetryMode,
  soundEnabled = true,
  onToggleSound,
  isLiveMode = false,
  isVariationActive = false,
  variationMoves = [],
  onExitVariation,
  liveCandidateArrows = [],
  onPieceDropAction,
}) => {
  const [retryBoardFen, setRetryBoardFen] = useState<string>(fen || START_FEN);
  const [retryMessage, setRetryMessage] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);

  useEffect(() => {
    if (isRetryMode && currentMove) {
      setRetryBoardFen(currentMove.fenBefore || START_FEN);
      setRetryMessage('Can you find the best move in this position?');
      setShowHint(false);
    } else {
      setRetryBoardFen(fen || START_FEN);
      setShowHint(false);
    }
  }, [isRetryMode, currentMove, fen]);

  // Audio effects
  const playSound = (type: 'move' | 'capture' | 'correct' | 'wrong') => {
    soundService.play(type, soundEnabled);
  };

  // Build tactical visual arrows for the board
  const customArrows = useMemo<Arrow[]>(() => {
    if ((isLiveMode || isVariationActive) && liveCandidateArrows.length > 0) {
      return liveCandidateArrows;
    }

    const arrows: Arrow[] = [];

    if (isRetryMode) {
      if (showHint && currentMove?.bestMove && currentMove.bestMove.length >= 4) {
        const from = currentMove.bestMove.substring(0, 2);
        const to = currentMove.bestMove.substring(2, 4);
        arrows.push({ startSquare: from, endSquare: to, color: 'rgba(129, 182, 76, 0.85)' });
      }
      return arrows;
    }

    if (!currentMove || isLiveMode) {
      return liveCandidateArrows.length > 0 ? liveCandidateArrows : arrows;
    }

    // Arrow 1: Played move (colored by classification)
    if (currentMove.from && currentMove.to && !isVariationActive) {
      const config = CLASSIFICATION_CONFIG[currentMove.classification] || CLASSIFICATION_CONFIG.good;
      const playedColor = `${config.hexColor}cc`;
      arrows.push({ startSquare: currentMove.from, endSquare: currentMove.to, color: playedColor });
    }

    // Arrow 2: Best move recommendation or Live MultiPV lines
    if (
      showEngineArrow &&
      ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(currentMove.classification) &&
      currentMove.bestMove &&
      currentMove.bestMove.length >= 4 &&
      currentMove.bestMove !== '(none)' &&
      !isVariationActive
    ) {
      const bestFrom = currentMove.bestMove.substring(0, 2);
      const bestTo = currentMove.bestMove.substring(2, 4);
      if (bestFrom !== currentMove.from || bestTo !== currentMove.to) {
        arrows.push({ startSquare: bestFrom, endSquare: bestTo, color: 'rgba(129, 182, 76, 0.9)' });
      }
    } else if (liveCandidateArrows.length > 0 && isVariationActive) {
      return liveCandidateArrows;
    }

    return arrows;
  }, [currentMove, showEngineArrow, isRetryMode, showHint, isVariationActive, isLiveMode, liveCandidateArrows]);

  // Handle piece drop across Retry, Variation, and Free drag modes
  const handlePieceDrop = ({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs): boolean => {
    if (!targetSquare) return false;
    const pieceType = piece?.pieceType || '';
    const promotion = pieceType.toLowerCase() === 'p' ? 'q' : undefined;

    // 1. Retry Mode Challenge
    if (isRetryMode && currentMove) {
      try {
        const chess = new Chess(retryBoardFen || START_FEN);
        const move = chess.move({
          from: sourceSquare as Square,
          to: targetSquare as Square,
          promotion,
        });

        if (!move) return false;

        const playedUci = `${sourceSquare}${targetSquare}`;
        const bestUci = (currentMove.bestMove || '').toLowerCase();

        if (playedUci.toLowerCase() === bestUci.substring(0, 4)) {
          setRetryBoardFen(chess.fen());
          setRetryMessage(`Excellent! You found ${move.san}, the best move! 🎉`);
          playSound('correct');
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
          return true;
        } else {
          setRetryMessage(`Not quite. ${move.san} wasn't the top move. Try again or check the hint.`);
          playSound('wrong');
          return false;
        }
      } catch {
        return false;
      }
    }

    // 2. Interactive Variation or Live Sandbox Drag
    if (onPieceDropAction) {
      const success = onPieceDropAction(sourceSquare as Square, targetSquare as Square, promotion);
      if (success) {
        playSound('move');
      }
      return success;
    }

    return false;
  };

  // Custom square badge rendering
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (!isVariationActive && !isRetryMode && currentMove && currentMove.to) {
      const config = CLASSIFICATION_CONFIG[currentMove.classification];
      if (config) {
        styles[currentMove.to] = {
          position: 'relative',
        };
      }
    }

    return styles;
  }, [currentMove, isRetryMode, isVariationActive]);

  const activePosition = (isRetryMode ? retryBoardFen : fen) || START_FEN;

  return (
    <div className="flex flex-col items-center w-full max-w-[540px]">
      {/* Interactive Variation Branch Banner */}
      {isVariationActive && (
        <div className="w-full mb-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/50 shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400">
              <GitBranch size={15} />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <span>Exploring Live Variation</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">
                  Live Engine Active
                </span>
              </div>
              <div className="text-[11px] font-mono text-zinc-300 truncate">
                {variationMoves.length > 0 ? variationMoves.join(' ') : 'Play alternative moves on the board'}
              </div>
            </div>
          </div>

          {onExitVariation && (
            <button
              onClick={onExitVariation}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition-colors shrink-0 shadow"
            >
              <X size={12} />
              <span>Back to Game</span>
            </button>
          )}
        </div>
      )}

      {/* Retry Mistake banner if active */}
      {isRetryMode && (
        <div className="w-full mb-2 p-3 rounded-xl bg-zinc-800 border border-emerald-500/50 shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div>
              <div className="text-sm font-semibold text-emerald-400">Retry Mistake Challenge</div>
              <div className="text-xs text-zinc-300">{retryMessage}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHint(true)}
              className="px-2.5 py-1 text-xs rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 flex items-center gap-1 transition-colors"
              title="Show Hint Arrow"
            >
              <HelpCircle size={13} />
              Hint
            </button>
            <button
              onClick={onExitRetryMode}
              className="px-2.5 py-1 text-xs rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Board Container */}
      <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl border-4 border-[#262421] bg-[#262421]">
        <Chessboard
          options={{
            position: activePosition,
            boardOrientation: orientation,
            allowDragging: true, // Always allow dragging to test moves & explore variations on the fly!
            onPieceDrop: handlePieceDrop,
            arrows: customArrows,
            squareStyles: customSquareStyles,
            boardStyle: {
              borderRadius: '8px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            },
            darkSquareStyle: { backgroundColor: '#779952' },
            lightSquareStyle: { backgroundColor: '#edeed1' },
            animationDurationInMs: 150,
          }}
        />

        {/* Move Classification Badge Overlay on Target Square */}
        {!isVariationActive && !isRetryMode && currentMove && currentMove.to && (
          <TargetSquareBadge
            key={`${currentMove.ply}-${currentMove.to}-${currentMove.classification}`}
            square={currentMove.to as Square}
            classification={currentMove.classification}
            orientation={orientation}
          />
        )}
      </div>

      {/* Quick Board Tools Bar */}
      <div className="flex items-center justify-between w-full mt-2 px-1 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <button
            onClick={onFlipBoard}
            className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800"
            title="Flip Board (X)"
          >
            <RotateCcw size={14} />
            <span>Flip Board</span>
          </button>

          {onToggleSound && (
            <button
              onClick={onToggleSound}
              className="flex items-center gap-1.5 hover:text-zinc-200 transition-colors p-1 rounded hover:bg-zinc-800"
              title="Toggle Audio"
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>
          )}
        </div>

        {!isVariationActive && currentMove ? (
          <div className="font-mono text-zinc-400">
            {currentMove.turn === 'w' ? 'White' : 'Black'} played <span className="font-bold text-zinc-200">{currentMove.san}</span>
          </div>
        ) : isVariationActive ? (
          <div className="font-mono text-xs text-purple-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>Live What-If Line</span>
          </div>
        ) : (
          <div className="text-zinc-500 text-[11px]">
            Drag pieces on board to explore variations live
          </div>
        )}
      </div>
    </div>
  );
};

interface TargetSquareBadgeProps {
  square: Square;
  classification: MoveClassification;
  orientation: 'white' | 'black';
}

const TargetSquareBadge: React.FC<TargetSquareBadgeProps> = ({
  square,
  classification,
  orientation,
}) => {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(square[1], 10) - 1;

  let colIndex = file;
  let rowIndex = 7 - rank;

  if (orientation === 'black') {
    colIndex = 7 - file;
    rowIndex = rank;
  }

  const left = `${colIndex * 12.5 + 8.5}%`;
  const top = `${rowIndex * 12.5 + 1.2}%`;

  const config = CLASSIFICATION_CONFIG[classification];
  if (!config) return null;

  return (
    <div
      className="absolute pointer-events-none z-20 transition-all duration-150"
      style={{ left, top }}
    >
      <div
        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black shadow-lg border border-black/40"
        style={{
          backgroundColor: config.hexColor,
          color: '#ffffff',
          boxShadow: `0 2px 8px ${config.hexColor}99`,
        }}
      >
        {config.symbol}
      </div>
    </div>
  );
};
