import React from 'react';
import type { GameReviewReport } from '../types/chess';
import { BookOpen, BarChart2, Upload, Sparkles, Trophy } from 'lucide-react';

interface GameReviewHeaderProps {
  report: GameReviewReport | null;
  onOpenSummary: () => void;
  onOpenImport?: () => void;
  onStartKeyMoments?: () => void;
  isKeyMomentsActive?: boolean;
}

export const GameReviewHeader: React.FC<GameReviewHeaderProps> = ({
  report,
  onOpenSummary,
  onOpenImport,
  onStartKeyMoments,
  isKeyMomentsActive = false,
}) => {
  if (!report) {
    return (
      <div className="w-full bg-[#1e1d1a] border border-zinc-800 rounded-xl p-3 sm:p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-100">Chess Game Review & AI Coach</div>
            <div className="text-xs text-zinc-400">Import a PGN or choose a game below to run Stockfish 18 review</div>
          </div>
        </div>

        {onOpenImport && (
          <button
            onClick={onOpenImport}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow hover:scale-105"
          >
            <Upload size={14} />
            Import Game / PGN
          </button>
        )}
      </div>
    );
  }

  const { metadata, whiteAccuracy, blackAccuracy, whiteEstimatedElo, blackEstimatedElo } = report;

  const keyMomentsCount = report.moves.filter(
    (m) => ['blunder', 'miss', 'mistake', 'brilliant', 'great'].includes(m.classification) || m.keyMoment
  ).length;

  const getAccuracyColor = (acc: number) => {
    if (acc >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (acc >= 80) return 'text-lime-400 border-lime-500/40 bg-lime-500/10';
    if (acc >= 70) return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
    if (acc >= 60) return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
    return 'text-red-400 border-red-500/40 bg-red-500/10';
  };

  return (
    <div className="w-full bg-[#1e1d1a] border border-zinc-800 rounded-xl p-3 shadow-md flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Player 1 (White) */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-200 text-zinc-900 font-bold flex items-center justify-center shadow">
            W
          </div>
          <div>
            <div className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
              <span>{metadata.white}</span>
              {metadata.whiteElo && (
                <span className="text-xs text-zinc-400 font-mono">({metadata.whiteElo})</span>
              )}
            </div>
            {whiteEstimatedElo && (
              <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Trophy size={11} className="text-amber-400" />
                <span>Played like <strong className="text-zinc-200 font-mono">~{whiteEstimatedElo}</strong></span>
              </div>
            )}
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${getAccuracyColor(whiteAccuracy)}`}>
          {whiteAccuracy}% <span className="text-[10px] font-sans font-normal opacity-80">acc</span>
        </div>
      </div>

      {/* Center Game Meta / ECO Opening & Key Moments Button */}
      <div className="flex flex-col items-center text-center px-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <BookOpen size={13} className="text-amber-400" />
          <span>{metadata.opening || 'Chess Opening'}</span>
          {metadata.eco && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
              {metadata.eco}
            </span>
          )}
        </div>

        {onStartKeyMoments && keyMomentsCount > 0 && (
          <button
            onClick={onStartKeyMoments}
            className={`mt-1 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow ${
              isKeyMomentsActive
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 hover:scale-105'
            }`}
          >
            <Sparkles size={13} className="text-emerald-400 animate-pulse" />
            <span>Key Moments ({keyMomentsCount})</span>
          </button>
        )}
      </div>

      {/* Player 2 (Black) */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${getAccuracyColor(blackAccuracy)}`}>
          {blackAccuracy}% <span className="text-[10px] font-sans font-normal opacity-80">acc</span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="font-semibold text-sm text-zinc-100 flex items-center justify-end gap-1.5">
              {metadata.blackElo && (
                <span className="text-xs text-zinc-400 font-mono">({metadata.blackElo})</span>
              )}
              <span>{metadata.black}</span>
            </div>
            {blackEstimatedElo && (
              <div className="text-[11px] text-zinc-400 flex items-center justify-end gap-1">
                <Trophy size={11} className="text-amber-400" />
                <span>Played like <strong className="text-zinc-200 font-mono">~{blackEstimatedElo}</strong></span>
              </div>
            )}
          </div>
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-bold flex items-center justify-center shadow">
            B
          </div>
        </div>

        <button
          onClick={onOpenSummary}
          className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
          title="View Full Game Review Report"
        >
          <BarChart2 size={14} className="text-emerald-400" />
          <span className="hidden sm:inline">Report</span>
        </button>
      </div>
    </div>
  );
};
