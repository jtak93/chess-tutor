import React, { useState, useEffect } from 'react';
import type { GameReviewReport } from '../types/chess';
import { History, X, Trash2, Sparkles } from 'lucide-react';

interface GameHistoryItem {
  cacheKey: string;
  timestamp: number;
  report: GameReviewReport;
}

interface GameHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (report: GameReviewReport) => void;
}

export const GameHistoryDrawer: React.FC<GameHistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectGame,
}) => {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);

  const loadHistory = () => {
    try {
      const items: GameHistoryItem[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chess_review_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const rep = JSON.parse(raw) as GameReviewReport;
              if (rep && rep.moves && rep.metadata) {
                items.push({
                  cacheKey: key,
                  timestamp: 0,
                  report: rep,
                });
              }
            } catch {}
          }
        }
      }
      setHistory(items.reverse());
    } catch (err) {
      console.warn('Failed to load review history:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear your local game review history?')) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('chess_review_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        setHistory([]);
      } catch {}
    }
  };

  const handleRemoveSingle = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(key);
      setHistory((prev) => prev.filter((item) => item.cacheKey !== key));
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#1e1d1a] border-l border-zinc-700/80 h-full flex flex-col shadow-2xl animate-slideLeft">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <History size={17} />
            <span className="text-zinc-100">Review History ({history.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                title="Clear All History"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List of Analyzed Games */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {history.length > 0 ? (
            history.map((item) => {
              const rep = item.report;
              const meta = rep.metadata;
              const wAcc = rep.whiteAccuracy;
              const bAcc = rep.blackAccuracy;

              return (
                <div
                  key={item.cacheKey}
                  onClick={() => {
                    onSelectGame(rep);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group flex flex-col gap-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[200px]">
                      {meta.opening || meta.event || 'Chess Game'}
                    </span>
                    <button
                      onClick={(e) => handleRemoveSingle(e, item.cacheKey)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 p-1 transition-all"
                      title="Remove from history"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Players & Accuracies */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-200 inline-block" />
                        <span>{meta.white || 'White'}</span>
                        <span className="font-mono text-emerald-400 text-[11px] font-semibold">
                          ({wAcc}%)
                        </span>
                      </div>
                      <div className="font-bold text-zinc-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" />
                        <span>{meta.black || 'Black'}</span>
                        <span className="font-mono text-emerald-400 text-[11px] font-semibold">
                          ({bAcc}%)
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Moves</div>
                      <div className="text-xs font-mono font-bold text-zinc-300">
                        {Math.ceil(rep.moves.length / 2)}
                      </div>
                    </div>
                  </div>

                  {/* Badges preview */}
                  <div className="flex items-center gap-3 pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-400">
                    {rep.classificationCounts.w.brilliant + rep.classificationCounts.b.brilliant > 0 && (
                      <span className="text-teal-400 flex items-center gap-1 font-semibold">
                        <Sparkles size={11} />
                        {rep.classificationCounts.w.brilliant + rep.classificationCounts.b.brilliant} Brilliant
                      </span>
                    )}
                    <span>Est. Elo: ~{rep.whiteEstimatedElo || '?'}/{rep.blackEstimatedElo || '?'}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-500">
              <History size={32} className="opacity-40" />
              <div className="text-xs font-bold text-zinc-400">No Review History</div>
              <div className="text-[11px] text-zinc-500">
                Games you analyze are saved locally so you can review them anytime without waiting.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 text-center text-[10px] text-zinc-500">
          Saved locally in your browser storage
        </div>
      </div>
    </div>
  );
};
