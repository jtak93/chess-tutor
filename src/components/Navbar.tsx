import React from 'react';
import type { CoachPersona } from '../types/chess';
import { Settings, Upload, BarChart2, Share2, History, Heart } from 'lucide-react';

interface NavbarProps {
  onOpenImport: () => void;
  onOpenSettings: () => void;
  onOpenSummary?: () => void;
  onOpenShare?: () => void;
  onOpenHistory?: () => void;
  onOpenSupport?: () => void;
  hasReport: boolean;
  persona: CoachPersona;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenImport,
  onOpenSettings,
  onOpenSummary,
  onOpenShare,
  onOpenHistory,
  onOpenSupport,
  hasReport,
}) => {
  return (
    <header className="w-full bg-[#1e1d1a] border-b border-zinc-800 px-3 sm:px-4 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md font-black text-sm">
          ♞
        </div>
        <div>
          <div className="font-extrabold text-sm sm:text-base text-zinc-100 flex items-center gap-1.5 tracking-tight">
            <span>Chess</span>
            <span className="text-emerald-400">Tutor</span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Free AI
            </span>
          </div>
          <div className="text-[10px] text-zinc-400 hidden sm:block">
            Game Analysis & Grandmaster Coach
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-medium text-xs flex items-center gap-1.5 border border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm"
            title="Saved Game Reviews History"
          >
            <History size={14} className="text-teal-400" />
            <span className="hidden md:inline">History</span>
          </button>
        )}

        {hasReport && onOpenShare && (
          <button
            onClick={onOpenShare}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-200 font-medium text-xs flex items-center gap-1.5 border border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm"
            title="Share or Export Scorecard Image"
          >
            <Share2 size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Share</span>
          </button>
        )}

        {onOpenSupport && (
          <button
            onClick={onOpenSupport}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-semibold text-xs flex items-center gap-1.5 border border-emerald-500/30 transition-all shadow-sm"
            title="Support this free project"
          >
            <Heart size={14} className="text-pink-400" />
            <span className="hidden md:inline">Support</span>
          </button>
        )}

        <button
          onClick={onOpenImport}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all hover:scale-105"
        >
          <Upload size={13} />
          <span>Load Game</span>
        </button>

        {hasReport && onOpenSummary && (
          <button
            onClick={onOpenSummary}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs flex items-center gap-1.5 border border-zinc-700 transition-colors shadow"
          >
            <BarChart2 size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">Report</span>
          </button>
        )}

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors"
          title="Settings & Gemini API Key"
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
};
