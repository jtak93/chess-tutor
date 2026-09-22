import React from 'react';
import { Heart, Coffee, ExternalLink, X, Sparkles, Gift } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1e1d1a] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header with gradient badge */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Heart size={20} className="fill-emerald-400/20" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Support Chess Tutor</h3>
              <p className="text-xs text-zinc-400">Keep AI analysis 100% free and open</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs text-zinc-300 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <Sparkles size={14} />
              <span>Why We Need Your Support</span>
            </div>
            <p>
              Chess Tutor is built to provide unlimited, master-level Stockfish 18 game analysis and grandmaster AI coaching without paywalls or restrictive daily limits.
            </p>
            <p className="text-zinc-400">
              Your donations directly cover domain hosting, model inference costs, and continuous open-source improvements.
            </p>
          </div>

          {/* Support Buttons */}
          <div className="space-y-2.5">
            <a
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-between shadow-md hover:shadow-amber-500/20 transition-all group"
            >
              <div className="flex items-center gap-2">
                <Coffee size={16} />
                <span>Buy Me a Coffee ($3)</span>
              </div>
              <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </a>

            <a
              href="https://github.com/sponsors"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs flex items-center justify-between border border-zinc-700 transition-all group"
            >
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-pink-400" />
                <span>Sponsor on GitHub</span>
              </div>
              <ExternalLink size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Chess Partner / Affiliate banner */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-950/30 to-indigo-950/20 border border-purple-800/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Gift size={18} className="text-purple-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-purple-200">Chess Equipment & Courses</div>
                <div className="text-[11px] text-zinc-400">Upgrade your chess study with top partner resources</div>
              </div>
            </div>
            <a
              href="https://www.chessable.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold shrink-0 transition-all"
            >
              Explore
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
