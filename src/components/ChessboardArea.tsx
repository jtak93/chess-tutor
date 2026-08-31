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
} from 'lucide-react';

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
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(196, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(type === 'capture' ? 350 : 260, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      }
    } catch {
      // Audio error
    }
  };

  // Build tactical visual arrows for the board
  const customArrows = useMemo<Arrow[]>(() => {
    const arrows: Arrow[] = [];

    if (isRetryMode) {
      if (showHint && currentMove?.bestMove && currentMove.bestMove.length >= 4) {
        const from = currentMove.bestMove.substring(0, 2);
        const to = currentMove.bestMove.substring(2, 4);
        arrows.push({ startSquare: from, endSquare: to, color: 'rgba(129, 182, 76, 0.85)' });
      }
      return arrows;
    }

    if (!currentMove) return arrows;

    // Arrow 1: Played move (colored by classification)
    if (currentMove.from && currentMove.to) {
      const config = CLASSIFICATION_CONFIG[currentMove.classification] || CLASSIFICATION_CONFIG.good;
      const playedColor = `${config.hexColor}cc`;
      arrows.push({ startSquare: currentMove.from, endSquare: currentMove.to, color: playedColor });
    }

    // Arrow 2: Best move recommendation
    if (
      showEngineArrow &&
      ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(currentMove.classification) &&
      currentMove.bestMove &&
      currentMove.bestMove.length >= 4 &&
      currentMove.bestMove !== '(none)'
    ) {
      const bestFrom = currentMove.bestMove.substring(0, 2);
      const bestTo = currentMove.bestMove.substring(2, 4);
      if (bestFrom !== currentMove.from || bestTo !== currentMove.to) {
        arrows.push({ startSquare: bestFrom, endSquare: bestTo, color: 'rgba(129, 182, 76, 0.9)' });
      }
    }

    return arrows;
  }, [currentMove, showEngineArrow, isRetryMode, showHint]);

  // Handle piece drop in Retry Mistake mode
  const handlePieceDrop = ({ sourceSquare, targetSquare, piece }: PieceDropHandlerArgs): boolean => {
    if (!isRetryMode || !currentMove || !targetSquare) return false;

    try {
      const chess = new Chess(retryBoardFen || START_FEN);
      const pieceType = piece?.pieceType || '';
      const move = chess.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: pieceType.toLowerCase() === 'p' ? 'q' : undefined,
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
  };

  // Custom square badge rendering
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (!isRetryMode && currentMove && currentMove.to) {
      const config = CLASSIFICATION_CONFIG[currentMove.classification];
      if (config) {
        styles[currentMove.to] = {
          position: 'relative',
        };
      }
    }

    return styles;
  }, [currentMove, isRetryMode]);

  const activePosition = (isRetryMode ? retryBoardFen : fen) || START_FEN;

  return (
    <div className="flex flex-col items-center w-full max-w-[540px]">
      {/* Retry Mistake banner if active */}
      {isRetryMode && (
        <div className="w-full mb-3 p-3 rounded-lg bg-zinc-800 border border-emerald-500/50 shadow-lg flex items-center justify-between animate-fadeIn">
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
            allowDragging: isRetryMode,
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
        {!isRetryMode && currentMove && currentMove.to && (
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

        {currentMove && (
          <div className="font-mono text-zinc-400">
            {currentMove.turn === 'w' ? 'White' : 'Black'} played <span className="font-bold text-zinc-200">{currentMove.san}</span>
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
