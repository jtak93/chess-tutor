import React from 'react';
import type { GameReviewReport, MoveClassification } from '../types/chess';
import { BadgeIcon, CLASSIFICATION_CONFIG } from './BadgeIcon';
import { X, Award, Sparkles, Trophy, Play } from 'lucide-react';

interface GameReviewSummaryProps {
  report: GameReviewReport;
  isOpen: boolean;
  onClose: () => void;
  onSelectPly: (ply: number) => void;
  onStartKeyMoments?: () => void;
}

const CLASSIFICATION_ORDER: MoveClassification[] = [
  'brilliant',
  'great',
  'best',
  'excellent',
  'good',
  'book',
  'inaccuracy',
  'mistake',
  'miss',
  'blunder',
];

export const GameReviewSummary: React.FC<GameReviewSummaryProps> = ({
  report,
  isOpen,
  onClose,
  onSelectPly,
  onStartKeyMoments,
}) => {
  if (!isOpen) return null;

  const { metadata, whiteAccuracy, blackAccuracy, whiteEstimatedElo, blackEstimatedElo, classificationCounts, summary, moves } = report;

  const keyMomentMoves = summary.keyTurningPoints.map((ply) => moves[ply]).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e1d1a] border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Game Review Report</h2>
              <div className="text-xs text-zinc-400">
                {metadata.white} vs {metadata.black} • {metadata.result}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Accuracy & Performance ELO Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* White Player Card */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center text-center space-y-1.5">
              <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                {metadata.white}
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {whiteAccuracy}%
              </div>
              <div className="text-xs text-zinc-400">CAPS2 Accuracy</div>

              {whiteEstimatedElo && (
                <div className="pt-2 border-t border-zinc-800 w-full flex items-center justify-center gap-1.5 text-xs text-zinc-300">
                  <Trophy size={13} className="text-amber-400" />
                  <span>Performance: <strong className="font-mono text-emerald-400">~{whiteEstimatedElo} ELO</strong></span>
                </div>
              )}

              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${whiteAccuracy}%` }}
                />
              </div>
            </div>

            {/* Black Player Card */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center text-center space-y-1.5">
              <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                {metadata.black}
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {blackAccuracy}%
              </div>
              <div className="text-xs text-zinc-400">CAPS2 Accuracy</div>

              {blackEstimatedElo && (
                <div className="pt-2 border-t border-zinc-800 w-full flex items-center justify-center gap-1.5 text-xs text-zinc-300">
                  <Trophy size={13} className="text-amber-400" />
                  <span>Performance: <strong className="font-mono text-emerald-400">~{blackEstimatedElo} ELO</strong></span>
                </div>
              )}

              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${blackAccuracy}%` }}
                />
              </div>
            </div>
          </div>

          {/* Coach Highlights */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-2 text-zinc-200">
            <div className="font-bold text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} />
                Coach Game Summary
              </span>
              {onStartKeyMoments && keyMomentMoves.length > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onStartKeyMoments();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-all hover:scale-105"
                >
                  <Play size={11} className="fill-white" />
                  Start Guided Walkthrough
                </button>
              )}
            </div>
            <div className="leading-relaxed">{summary.openingSummary}</div>
            <div className="leading-relaxed">{summary.whiteHighlights}</div>
            <div className="leading-relaxed">{summary.blackHighlights}</div>
          </div>

          {/* Move Classification Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Move Classification Breakdown
            </h3>

            <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/50">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/40 text-zinc-400">
                    <th className="py-2 px-3 text-center w-16">White</th>
                    <th className="py-2 px-3">Classification</th>
                    <th className="py-2 px-3 text-center w-16">Black</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {CLASSIFICATION_ORDER.map((cls) => {
                    const countW = classificationCounts.w[cls] || 0;
                    const countB = classificationCounts.b[cls] || 0;
                    const cfg = CLASSIFICATION_CONFIG[cls];

                    return (
                      <tr key={cls} className="hover:bg-zinc-800/30">
                        <td className="py-2 px-3 text-center font-mono font-semibold text-zinc-200">
                          {countW}
                        </td>
                        <td className="py-2 px-3 flex items-center gap-2">
                          <BadgeIcon classification={cls} size="xs" />
                          <span className="font-medium text-zinc-200">{cfg.label}</span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-semibold text-zinc-200">
                          {countB}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Turning Points */}
          {keyMomentMoves.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Key Turning Points ({keyMomentMoves.length})
              </h3>
              <div className="space-y-1.5">
                {keyMomentMoves.map((m) => (
                  <button
                    key={`kp-${m.ply}`}
                    onClick={() => {
                      onSelectPly(m.ply);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <BadgeIcon classification={m.classification} size="sm" />
                      <span className="font-mono font-bold text-zinc-200">
                        {m.turn === 'w' ? `${m.moveNumber}.` : `${m.moveNumber}...`} {m.san}
                      </span>
                      <span className="text-zinc-400 truncate max-w-xs">{m.coachComment}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">Jump to Move &rarr;</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
          >
            Back to Interactive Board
          </button>
        </div>
      </div>
    </div>
  );
};
