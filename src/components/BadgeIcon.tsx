import React from 'react';
import type { MoveClassification } from '../types/chess';
import {
  Sparkles,
  Award,
  Star,
  CheckCircle2,
  Check,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  XCircle,
  Zap,
} from 'lucide-react';

export const CLASSIFICATION_CONFIG: Record<
  MoveClassification,
  {
    label: string;
    symbol: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    hexColor: string;
    description: string;
  }
> = {
  brilliant: {
    label: 'Brilliant',
    symbol: '!!',
    bgClass: 'bg-teal-500/20 text-teal-400 border-teal-500',
    textClass: 'text-teal-400',
    borderClass: 'border-teal-500',
    hexColor: '#1baaa0',
    description: 'A brilliant move that sacrifices material to gain a decisive advantage.',
  },
  great: {
    label: 'Great',
    symbol: '!',
    bgClass: 'bg-sky-500/20 text-sky-400 border-sky-500',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500',
    hexColor: '#5c8bb0',
    description: 'The only winning or critical move in a sharp position.',
  },
  best: {
    label: 'Best',
    symbol: '★',
    bgClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500',
    hexColor: '#95bb4a',
    description: 'The top engine move recommendation.',
  },
  excellent: {
    label: 'Excellent',
    symbol: '✓',
    bgClass: 'bg-lime-500/20 text-lime-400 border-lime-500',
    textClass: 'text-lime-400',
    borderClass: 'border-lime-500',
    hexColor: '#96bc4b',
    description: 'An almost optimal move that maintains strong pressure.',
  },
  good: {
    label: 'Good',
    symbol: '👍',
    bgClass: 'bg-amber-500/15 text-amber-300 border-amber-500/50',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/50',
    hexColor: '#a8b577',
    description: 'A solid move that keeps the position intact.',
  },
  book: {
    label: 'Book',
    symbol: '📖',
    bgClass: 'bg-amber-700/20 text-amber-400 border-amber-700/60',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-700',
    hexColor: '#d5a47d',
    description: 'A standard opening theory move.',
  },
  inaccuracy: {
    label: 'Inaccuracy',
    symbol: '?!',
    bgClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500',
    hexColor: '#f0c15c',
    description: 'A slight mistake that gives away some advantage.',
  },
  mistake: {
    label: 'Mistake',
    symbol: '?',
    bgClass: 'bg-orange-500/20 text-orange-400 border-orange-500',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500',
    hexColor: '#e6912c',
    description: 'A noticeable mistake that worsens the position.',
  },
  miss: {
    label: 'Miss',
    symbol: '💔',
    bgClass: 'bg-rose-500/20 text-rose-400 border-rose-500',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500',
    hexColor: '#db5353',
    description: 'A missed opportunity to punish the opponent or win material.',
  },
  blunder: {
    label: 'Blunder',
    symbol: '??',
    bgClass: 'bg-red-500/20 text-red-400 border-red-500',
    textClass: 'text-red-400',
    borderClass: 'border-red-500',
    hexColor: '#ca3431',
    description: 'A catastrophic blunder that dramatically swings the game.',
  },
};

interface BadgeIconProps {
  classification: MoveClassification;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({
  classification,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const config = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG.good;

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 18,
    lg: 24,
  };

  const currentIconSize = iconSizes[size];

  const renderIcon = () => {
    switch (classification) {
      case 'brilliant':
        return <Sparkles size={currentIconSize} className="text-teal-400" />;
      case 'great':
        return <Award size={currentIconSize} className="text-sky-400" />;
      case 'best':
        return <Star size={currentIconSize} className="text-emerald-400 fill-emerald-400" />;
      case 'excellent':
        return <CheckCircle2 size={currentIconSize} className="text-lime-400" />;
      case 'good':
        return <Check size={currentIconSize} className="text-amber-300" />;
      case 'book':
        return <BookOpen size={currentIconSize} className="text-amber-400" />;
      case 'inaccuracy':
        return <HelpCircle size={currentIconSize} className="text-yellow-400" />;
      case 'mistake':
        return <AlertTriangle size={currentIconSize} className="text-orange-400" />;
      case 'miss':
        return <Zap size={currentIconSize} className="text-rose-400" />;
      case 'blunder':
        return <XCircle size={currentIconSize} className="text-red-500 fill-red-500/20" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${
        showLabel
          ? `px-2.5 py-0.5 text-xs border ${config.bgClass}`
          : 'p-1'
      } ${className}`}
      title={`${config.label} (${config.symbol}) - ${config.description}`}
    >
      {renderIcon()}
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};
