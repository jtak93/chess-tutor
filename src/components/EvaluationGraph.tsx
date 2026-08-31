import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { MoveAnalysis } from '../types/chess';
import { CLASSIFICATION_CONFIG } from './BadgeIcon';

interface EvaluationGraphProps {
  moves: MoveAnalysis[];
  currentPly: number;
  onSelectPly: (ply: number) => void;
}

export const EvaluationGraph: React.FC<EvaluationGraphProps> = ({
  moves,
  currentPly,
  onSelectPly,
}) => {
  if (!moves || moves.length === 0) return null;

  const data = [
    {
      ply: -1,
      name: 'Start',
      score: 0,
      san: '',
      turn: 'w',
      classification: 'book',
      rawEval: 0,
    },
    ...moves.map((m) => {
      let score = 0;
      if (m.evalAfter.type === 'mate') {
        score = m.evalAfter.whiteValue > 0 ? 10 : -10;
      } else {
        score = Math.max(-10, Math.min(10, m.evalAfter.whiteValue / 100));
      }

      return {
        ply: m.ply,
        name: `${m.turn === 'w' ? Math.floor(m.ply / 2) + 1 + '.' : ''}${m.san}`,
        score,
        san: m.san,
        turn: m.turn,
        classification: m.classification,
        rawEval: m.evalAfter.whiteValue,
        isMate: m.evalAfter.type === 'mate',
      };
    }),
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      if (!point || point.ply === -1) return null;

      const config = CLASSIFICATION_CONFIG[point.classification as keyof typeof CLASSIFICATION_CONFIG];
      const evalDisplay = point.isMate
        ? `M${Math.abs(point.rawEval)}`
        : `${point.rawEval > 0 ? '+' : ''}${(point.rawEval / 100).toFixed(1)}`;

      return (
        <div className="bg-zinc-900 border border-zinc-700 p-2.5 rounded-lg shadow-xl text-xs space-y-1 z-30">
          <div className="flex items-center justify-between gap-3 font-semibold text-zinc-200">
            <span>Move: {point.name}</span>
            <span className="font-mono text-emerald-400">{evalDisplay}</span>
          </div>
          {config && (
            <div className="flex items-center gap-1.5 text-zinc-300">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: config.hexColor }}
              />
              <span className="font-medium" style={{ color: config.hexColor }}>
                {config.label}
              </span>
            </div>
          )}
          <div className="text-[10px] text-zinc-400">Click to jump to move</div>
        </div>
      );
    }
    return null;
  };

  const handleDotClick = (entry: any) => {
    if (entry && typeof entry.ply === 'number') {
      onSelectPly(Math.max(-1, entry.ply));
    }
  };

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy || !payload || payload.ply === -1) return null;

    const isCurrent = payload.ply === currentPly;
    const isBlunder = payload.classification === 'blunder';
    const isMiss = payload.classification === 'miss';
    const isMistake = payload.classification === 'mistake';
    const isBrilliant = payload.classification === 'brilliant';
    const isGreat = payload.classification === 'great';

    if (isCurrent) {
      return (
        <g key={`dot-current-${payload.ply}`}>
          <circle cx={cx} cy={cy} r={7} fill="#ffffff" stroke="#81b64c" strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={3} fill="#81b64c" />
        </g>
      );
    }

    if (isBrilliant) {
      return (
        <polygon
          key={`dot-brilliant-${payload.ply}`}
          points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`}
          fill="#1baaa0"
          stroke="#ffffff"
          strokeWidth={1}
          className="cursor-pointer hover:scale-125 transition-transform"
          onClick={() => handleDotClick(payload)}
        />
      );
    }

    if (isGreat) {
      return (
        <circle
          key={`dot-great-${payload.ply}`}
          cx={cx}
          cy={cy}
          r={4}
          fill="#5c8bb0"
          stroke="#ffffff"
          strokeWidth={1}
          className="cursor-pointer"
          onClick={() => handleDotClick(payload)}
        />
      );
    }

    if (isBlunder || isMiss) {
      return (
        <circle
          key={`dot-blunder-${payload.ply}`}
          cx={cx}
          cy={cy}
          r={4.5}
          fill={isBlunder ? '#ca3431' : '#db5353'}
          stroke="#ffffff"
          strokeWidth={1}
          className="cursor-pointer"
          onClick={() => handleDotClick(payload)}
        />
      );
    }

    if (isMistake) {
      return (
        <circle
          key={`dot-mistake-${payload.ply}`}
          cx={cx}
          cy={cy}
          r={3.5}
          fill="#e6912c"
          className="cursor-pointer"
          onClick={() => handleDotClick(payload)}
        />
      );
    }

    return null;
  };

  return (
    <div className="w-full bg-[#1e1d1a] border border-zinc-800 rounded-xl p-3 shadow-md flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-zinc-400 font-medium px-1">
        <div className="flex items-center gap-3">
          <span className="text-zinc-300 font-semibold">Evaluation Advantage</span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" /> Brilliant
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Blunder
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Mistake
            </span>
          </div>
        </div>
        <span className="text-[11px] font-mono text-zinc-500">
          Move {currentPly >= 0 ? `${Math.floor(currentPly / 2) + 1}` : 'Start'} of {Math.ceil(moves.length / 2)}
        </span>
      </div>

      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload[0]) {
                handleDotClick(e.activePayload[0].payload);
              }
            }}
            margin={{ top: 8, right: 10, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#81b64c" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#262421" stopOpacity={0.7} />
              </linearGradient>
            </defs>

            <XAxis dataKey="name" hide />
            <YAxis domain={[-10, 10]} ticks={[-8, 0, 8]} hide />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#44413c" strokeDasharray="3 3" />

            <Area
              type="monotone"
              dataKey="score"
              stroke="#95bb4a"
              strokeWidth={2}
              fill="url(#evalGradient)"
              dot={renderCustomDot}
              activeDot={{ r: 6, fill: '#81b64c', stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
