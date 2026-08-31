import React from 'react';
import type { EngineEval } from '../types/chess';
import { evalToWinChance } from '../services/classification';

interface EvaluationBarProps {
  evaluation?: EngineEval;
  orientation?: 'white' | 'black';
  height?: string;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  evaluation = { type: 'cp', value: 0, whiteValue: 0, depth: 10 },
  orientation = 'white',
  height = 'h-[500px]',
}) => {
  const isWhite = orientation === 'white';
  const winChance = evalToWinChance(evaluation);

  let whitePercent = Math.min(96, Math.max(4, winChance));
  if (!isWhite) {
    whitePercent = 100 - whitePercent;
  }

  let evalText = '0.0';
  const isMate = evaluation.type === 'mate';

  if (isMate) {
    const mateVal = evaluation.whiteValue;
    evalText = `M${Math.abs(mateVal)}`;
  } else {
    const score = evaluation.whiteValue / 100;
    const sign = score > 0 ? '+' : '';
    evalText = `${sign}${score.toFixed(1)}`;
  }

  const isWhiteAdvantage = evaluation.whiteValue >= 0;
  const showTextAtTop = isWhite ? !isWhiteAdvantage : isWhiteAdvantage;

  return (
    <div className={`relative w-7 bg-zinc-900 rounded-lg overflow-hidden flex flex-col justify-end shadow-md border border-zinc-800/80 ${height}`}>
      <div className="absolute inset-0 bg-[#262421] transition-all duration-300" />
      <div
        className="w-full bg-[#f0f0ee] transition-all duration-300 relative eval-bar-fill"
        style={{ height: `${whitePercent}%` }}
      />
      <div
        className={`absolute w-full text-center font-mono font-bold text-[10px] sm:text-xs z-10 transition-all duration-200 pointer-events-none ${
          showTextAtTop
            ? 'top-2 text-zinc-300'
            : 'bottom-2 text-zinc-900'
        }`}
      >
        {evalText}
      </div>
    </div>
  );
};
