import React, { useEffect, useRef, useState } from 'react';
import type { MoveAnalysis } from '../types/chess';
import { BadgeIcon } from './BadgeIcon';
import { Filter, AlertCircle, Sparkles } from 'lucide-react';

interface MoveListProps {
  moves: MoveAnalysis[];
  currentPly: number;
  onSelectPly: (ply: number) => void;
}

type FilterType = 'all' | 'key' | 'mistakes';

export const MoveList: React.FC<MoveListProps> = ({
  moves,
  currentPly,
  onSelectPly,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const activeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group moves into pairs (White move, Black move per full turn)
  const turns: { turnNumber: number; white?: MoveAnalysis; black?: MoveAnalysis }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    turns.push({
      turnNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  // Auto-scroll safely when current ply changes
  useEffect(() => {
    if (currentPly >= 0 && activeRef.current && containerRef.current) {
      try {
        activeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      } catch {
        // ignore scroll error
      }
    } else if (currentPly === -1 && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPly]);

  const matchesFilter = (m?: MoveAnalysis): boolean => {
    if (!m) return false;
    if (filter === 'all') return true;
    if (filter === 'key') {
      return ['brilliant', 'great', 'mistake', 'miss', 'blunder'].includes(m.classification);
    }
    if (filter === 'mistakes') {
      return ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(m.classification);
    }
    return true;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1d1a] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
      {/* Header & Filter Tabs */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Filter size={13} className="text-zinc-400" />
          Moves ({moves.length})
        </span>

        <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
              filter === 'all'
                ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('key')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
              filter === 'key'
                ? 'bg-zinc-700 text-teal-300 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={11} />
            Key
          </button>
          <button
            onClick={() => setFilter('mistakes')}
            className={`px-2 py-0.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
              filter === 'mistakes'
                ? 'bg-zinc-700 text-red-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertCircle size={11} />
            Mistakes
          </button>
        </div>
      </div>

      {/* Move Rows Scroll Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {turns.map((t) => {
          const showRow =
            filter === 'all' ||
            matchesFilter(t.white) ||
            matchesFilter(t.black);

          if (!showRow) return null;

          return (
            <div
              key={`turn-${t.turnNumber}`}
              className="grid grid-cols-12 items-center text-xs py-0.5 rounded hover:bg-zinc-800/40 px-1.5 transition-colors"
            >
              {/* Turn Number */}
              <div className="col-span-2 font-mono text-zinc-500 font-medium">
                {t.turnNumber}.
              </div>

              {/* White Move */}
              <div className="col-span-5 pr-1">
                {t.white ? (
                  <button
                    ref={t.white.ply === currentPly ? activeRef : null}
                    onClick={() => onSelectPly(t.white!.ply)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded transition-all ${
                      t.white.ply === currentPly
                        ? 'bg-[#81b64c] text-white font-bold shadow-sm'
                        : 'hover:bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <span className="font-mono">{t.white.san}</span>
                    <BadgeIcon classification={t.white.classification} size="xs" />
                  </button>
                ) : null}
              </div>

              {/* Black Move */}
              <div className="col-span-5 pl-1">
                {t.black ? (
                  <button
                    ref={t.black.ply === currentPly ? activeRef : null}
                    onClick={() => onSelectPly(t.black!.ply)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded transition-all ${
                      t.black.ply === currentPly
                        ? 'bg-[#81b64c] text-white font-bold shadow-sm'
                        : 'hover:bg-zinc-800 text-zinc-200'
                    }`}
                  >
                    <span className="font-mono">{t.black.san}</span>
                    <BadgeIcon classification={t.black.classification} size="xs" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
