import React from 'react';
import { Shield, FileText, Code2, Heart } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms }) => {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-[#161513] py-4 px-4 mt-6 text-xs text-zinc-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Tagline */}
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-zinc-300">♟️ Chess Tutor</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-[11px]">
            Built with <Heart size={11} className="text-red-500 fill-red-500" /> for chess players
          </span>
        </div>

        {/* Right: Legal & Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
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
            <span>Source Code</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
