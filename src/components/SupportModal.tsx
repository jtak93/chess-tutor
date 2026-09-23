import React, { useState } from 'react';
import { Heart, Star, Share2, MessageSquare, Check, X, Sparkles } from 'lucide-react';

const GithubIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + window.location.pathname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const buyMeACoffeeUrl = (import.meta as any).env?.VITE_BUYMEACOFFEE_URL || '';
  const githubRepoUrl = 'https://github.com/jtak93/chess-tutor';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#1e1d1a] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Support Chess Tutor</h3>
              <p className="text-xs text-zinc-400">Free, open-source chess analysis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-2">
            <p className="font-semibold text-zinc-200">
              Chess Tutor is built for the chess community with no subscriptions, paywalls, or daily limits.
            </p>
            <p className="text-zinc-400 text-[11px]">
              Stockfish 18 runs directly inside your browser via WebAssembly, and all analyses are stored privately on your device.
            </p>
          </div>

          {/* Action List */}
          <div className="space-y-2.5">
            {/* Star on GitHub */}
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 text-zinc-100 font-medium text-xs flex items-center justify-between border border-zinc-700 hover:border-zinc-600 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <GithubIcon size={16} className="text-zinc-300" />
                <span>Star repository on GitHub</span>
              </div>
              <div className="flex items-center gap-1 text-amber-400 text-[11px] font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                <Star size={12} className="fill-amber-400" />
                <span>Star</span>
              </div>
            </a>

            {/* Share with Friends */}
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 text-zinc-100 font-medium text-xs flex items-center justify-between border border-zinc-700 hover:border-zinc-600 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Share2 size={16} className="text-emerald-400" />
                <span>Share with other chess players</span>
              </div>
              <div className="text-[11px] font-semibold text-zinc-300 bg-zinc-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                {copied ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <span>Copy Link</span>
                )}
              </div>
            </button>

            {/* Report Bugs / Feedback */}
            <a
              href={`${githubRepoUrl}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3.5 rounded-xl bg-zinc-800/90 hover:bg-zinc-800 text-zinc-100 font-medium text-xs flex items-center justify-between border border-zinc-700 hover:border-zinc-600 transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare size={16} className="text-sky-400" />
                <span>Suggest a feature or report a bug</span>
              </div>
              <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors text-[11px]">
                Issues →
              </span>
            </a>

            {/* Optional Tip Button if env variable configured */}
            {buyMeACoffeeUrl && (
              <a
                href={buyMeACoffeeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-between shadow-md transition-all"
              >
                <div className="flex items-center gap-2">
                  <Heart size={15} className="fill-zinc-950" />
                  <span>Buy Me a Coffee</span>
                </div>
                <span className="text-[11px] opacity-80">Tip</span>
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
