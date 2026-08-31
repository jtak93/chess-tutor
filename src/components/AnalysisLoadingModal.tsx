import React from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';

interface AnalysisLoadingModalProps {
  isOpen: boolean;
  progress: number;
  currentPly: number;
  totalPlies: number;
}

export const AnalysisLoadingModal: React.FC<AnalysisLoadingModalProps> = ({
  isOpen,
  progress,
  currentPly,
  totalPlies,
}) => {
  if (!isOpen) return null;

  const totalMoves = Math.max(1, Math.ceil(totalPlies / 2));
  const currentMove = Math.min(totalMoves, Math.max(1, Math.ceil(currentPly / 2)));
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-200">
      <div className="bg-[#1e1d1a] border border-zinc-700/80 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl space-y-4">
        {/* Animated Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
          <Cpu size={28} className="animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center justify-center gap-1.5">
            <span>Analyzing Game</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Stockfish 18
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Evaluating positions, alternative lines & calculating accuracy...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-1">
          <div className="w-full bg-zinc-800/90 h-2.5 rounded-full overflow-hidden p-0.5 border border-zinc-700/60">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-150 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-zinc-400 font-mono px-0.5">
            <span>
              Move {currentMove} of {totalMoves}
            </span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              {clampedProgress >= 100 && <CheckCircle2 size={12} />}
              {clampedProgress}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
