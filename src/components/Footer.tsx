import React from 'react';
import { Shield, FileText, Code2, Heart } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenSupport?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms, onOpenSupport }) => {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-[#161513] py-5 px-4 mt-8 text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-zinc-300">♟️ Chess Tutor</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-[11px]">
            100% Free Stockfish 18 Game Review
          </span>
        </div>

        {/* Right: Legal & Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-semibold"
            >
              <Heart size={12} className="text-pink-400 fill-pink-400" />
              <span>Support Project</span>
            </button>
          )}

          <button
            onClick={onOpenPrivacy}
            className="hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <Shield size={12} />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={onOpenTerms}
            className="hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <FileText size={12} />
            <span>Terms of Service</span>
          </button>

          <a
            href="https://github.com/jtak93/chess-tutor"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-300 transition-colors flex items-center gap-1"
          >
            <Code2 size={12} />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
