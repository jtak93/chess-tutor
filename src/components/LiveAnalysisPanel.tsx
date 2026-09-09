import React, { useState } from 'react';
import type { LiveAnalysisUpdate, LiveEngineLine, CoachPersona } from '../types/chess';
import { geminiCoachService } from '../services/geminiCoach';
import {
  Sparkles,
  Activity,
  Bot,
  Flame,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface LiveAnalysisPanelProps {
  analysis: LiveAnalysisUpdate | null;
  currentFen: string;
  onPreviewLine?: (line: LiveEngineLine) => void;
  persona: CoachPersona;
  onResetToStart?: () => void;
  isPlayEngineMode?: boolean;
  onTogglePlayEngine?: () => void;
}

export const LiveAnalysisPanel: React.FC<LiveAnalysisPanelProps> = ({
  analysis,
  currentFen,
  onPreviewLine,
  persona,
  onResetToStart,
  isPlayEngineMode = false,
  onTogglePlayEngine,
}) => {
  const [coachAdvice, setCoachAdvice] = useState<string>('');
  const [isLoadingCoach, setIsLoadingCoach] = useState<boolean>(false);

  const topLines = analysis?.topLines || [];
  const depth = analysis?.depth || 0;
  const maxDepth = analysis?.maxDepth || 18;
  const nodes = analysis?.nodes || 0;

  const handleAskCoach = async () => {
    setIsLoadingCoach(true);
    try {
      const topMoveText = topLines[0]
        ? `Best move is ${topLines[0].san} (${topLines[0].eval.whiteValue > 0 ? '+' : ''}${(topLines[0].eval.whiteValue / 100).toFixed(1)}). Continuation: ${topLines[0].pvSan.slice(0, 4).join(' ')}`
        : '';

      const response = await geminiCoachService.explainCustomPosition(
        currentFen,
        topMoveText,
        persona
      );
      setCoachAdvice(response);
    } catch {
      setCoachAdvice('Focus on piece activity, controlling open files, and keeping your king safe.');
    } finally {
      setIsLoadingCoach(false);
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 2:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 3:
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1d1a] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
      {/* Header with Live Engine Depth & Status */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
            <Activity size={14} className={analysis?.isSearching ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <span>Live Engine Analysis</span>
              <span className="font-mono text-[10px] text-zinc-400 font-normal">
                Depth {depth}/{maxDepth}
              </span>
            </div>
            {nodes > 0 && (
              <div className="text-[10px] text-zinc-500 font-mono">
                {(nodes / 1000000).toFixed(1)}M nodes calculated
              </div>
            )}
          </div>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-1.5">
          {onTogglePlayEngine && (
            <button
              onClick={onTogglePlayEngine}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                isPlayEngineMode
                  ? 'bg-purple-600 text-white shadow ring-1 ring-purple-400'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
              }`}
              title="Play against Stockfish engine"
            >
              <Bot size={12} />
              <span>{isPlayEngineMode ? 'Bot: On' : 'Play Bot'}</span>
            </button>
          )}

          {onResetToStart && (
            <button
              onClick={onResetToStart}
              className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
              title="Reset Board to Starting Position"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Top 3 Candidate Lines (MultiPV) */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <Flame size={12} className="text-amber-400" />
            Top Engine Lines (MultiPV)
          </div>

          {topLines.length > 0 ? (
            topLines.map((line) => {
              const isMate = line.eval.type === 'mate';
              const evalText = isMate
                ? `M${Math.abs(line.eval.whiteValue)}`
                : `${line.eval.whiteValue > 0 ? '+' : ''}${(line.eval.whiteValue / 100).toFixed(1)}`;

              return (
                <div
                  key={`line-${line.rank}`}
                  onClick={() => onPreviewLine && onPreviewLine(line)}
                  className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800/80 flex items-center justify-between text-xs cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${getRankBadge(line.rank)}`}>
                      #{line.rank}
                    </span>

                    <span className="font-mono font-bold text-zinc-100">{line.san}</span>

                    <span className="text-zinc-400 font-mono text-[11px] truncate max-w-[150px] sm:max-w-[200px]">
                      {line.pvSan.slice(1, 5).join(' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`font-mono font-bold text-xs ${line.eval.whiteValue >= 0 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {evalText}
                    </span>
                    <Play size={10} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-zinc-500 text-xs">
              Evaluating position...
            </div>
          )}
        </div>

        {/* Live AI Coach Insight */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-950/30 to-teal-950/20 border border-emerald-800/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Sparkles size={14} />
              <span>AI Grandmaster Advice</span>
            </div>

            <button
              onClick={handleAskCoach}
              disabled={isLoadingCoach}
              className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1 shadow transition-all"
            >
              {isLoadingCoach ? (
                <span>Thinking...</span>
              ) : (
                <>
                  <Bot size={12} />
                  <span>Explain Position</span>
                </>
              )}
            </button>
          </div>

          {coachAdvice ? (
            <p className="text-xs text-zinc-200 leading-relaxed animate-fadeIn">
              {coachAdvice}
            </p>
          ) : (
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Click <strong>"Explain Position"</strong> to ask your AI coach for strategic ideas and positional advice on this custom board state.
            </p>
          )}
        </div>

        {/* Live Board Guidance Note */}
        <div className="p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 text-[11px] text-zinc-400 flex items-center gap-2">
          <AlertTriangle size={13} className="text-amber-400 shrink-0" />
          <span>You can drag pieces on either side to explore variations. Stockfish recalculates instantly on the fly!</span>
        </div>
      </div>
    </div>
  );
};
