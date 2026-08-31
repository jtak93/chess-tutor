import React from 'react';
import type { MoveAnalysis } from '../types/chess';
import { CLASSIFICATION_CONFIG } from './BadgeIcon';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  HelpCircle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';

interface KeyMomentsBarProps {
  keyMoments: MoveAnalysis[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onExit: () => void;
  onShowHint?: () => void;
  isSolved?: boolean;
}

export const KeyMomentsBar: React.FC<KeyMomentsBarProps> = ({
  keyMoments,
  currentIndex,
  onSelectIndex,
  onExit,
  onShowHint,
  isSolved = false,
}) => {
  if (!keyMoments || keyMoments.length === 0) return null;

  const current = keyMoments[currentIndex];
  if (!current) return null;

  const config = CLASSIFICATION_CONFIG[current.classification] || CLASSIFICATION_CONFIG.good;
  const isMistake = ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(current.classification);
  const player = current.turn === 'w' ? 'White' : 'Black';

  return (
    <div className="w-full bg-[#1e1d1a] border border-emerald-500/60 rounded-xl p-3 shadow-xl space-y-2.5 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="text-xs font-extrabold text-zinc-100 flex items-center gap-2">
              <span>Guided Key Moments Review</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                Moment {currentIndex + 1} of {keyMoments.length}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onExit}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Exit Key Moments Review"
        >
          <X size={16} />
        </button>
      </div>

      {/* Moment Selection Breadcrumbs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {keyMoments.map((km, idx) => {
          const kmConfig = CLASSIFICATION_CONFIG[km.classification] || CLASSIFICATION_CONFIG.good;
          const isSelected = idx === currentIndex;
          return (
            <button
              key={`km-${km.ply}-${idx}`}
              onClick={() => onSelectIndex(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all ${
                isSelected
                  ? 'bg-zinc-800 text-white border border-emerald-500 shadow'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                style={{ backgroundColor: kmConfig.hexColor }}
              >
                {kmConfig.symbol}
              </span>
              <span className="font-mono text-[11px]">
                {km.turn === 'w' ? Math.floor(km.ply / 2) + 1 + '.' : Math.floor(km.ply / 2) + 1 + '...'}{km.san}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Challenge Card */}
      <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black uppercase tracking-wider"
              style={{ color: config.hexColor }}
            >
              {config.label} ({config.symbol})
            </span>
            <span className="text-xs text-zinc-300">
              Move {Math.floor(current.ply / 2) + 1} — {player} played <strong className="font-mono text-zinc-100">{current.san}</strong>
            </span>
          </div>

          <div className="text-xs text-zinc-400">
            {isMistake ? (
              isSolved ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Solved! You found the best move ({current.bestMoveSan})!
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-300">
                  <Lightbulb size={13} />
                  Challenge: Can you find the best move for {player} on the board?
                </span>
              )
            ) : (
              <span className="text-zinc-300">
                {current.coachComment || 'Critical tactical breakthrough played!'}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {isMistake && onShowHint && !isSolved && (
            <button
              onClick={onShowHint}
              className="px-2.5 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1 transition-colors"
            >
              <HelpCircle size={12} className="text-amber-400" />
              <span>Hint</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelectIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-200 transition-colors"
              title="Previous Key Moment"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => onSelectIndex(Math.min(keyMoments.length - 1, currentIndex + 1))}
              disabled={currentIndex >= keyMoments.length - 1}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-semibold text-xs flex items-center gap-1 transition-all shadow"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
