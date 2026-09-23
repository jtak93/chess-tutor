import React, { useEffect, useRef } from 'react';
import { Lightbulb, Star } from 'lucide-react';

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

interface AdBannerProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'responsive' | 'sidebar' | 'feed';
  className?: string;
  onOpenSupport?: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId,
  format = 'horizontal',
  className = '',
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef<boolean>(false);

  const clientId = (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID || '';
  const effectiveSlotId = slotId || (import.meta as any).env?.VITE_AD_SLOT_BANNER || '';

  useEffect(() => {
    if (clientId && effectiveSlotId && !isInitialized.current && typeof window !== 'undefined') {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        isInitialized.current = true;
      } catch (err) {
        console.debug('AdSense script not loaded yet or ad blocked:', err);
      }
    }
  }, [clientId, effectiveSlotId]);

  // Dimension classes based on format
  const formatClasses = (() => {
    switch (format) {
      case 'rectangle':
        return 'w-full max-w-[300px] min-h-[140px] mx-auto';
      case 'sidebar':
        return 'w-full min-h-[120px]';
      case 'feed':
        return 'w-full min-h-[70px]';
      case 'responsive':
        return 'w-full min-h-[70px]';
      case 'horizontal':
      default:
        return 'w-full max-w-[728px] min-h-[70px] mx-auto';
    }
  })();

  // If real AdSense is configured, render the ad unit with label
  if (clientId && effectiveSlotId) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-[#1e1d1a]/80 border border-zinc-800/80 flex flex-col items-center justify-center p-2 transition-all ${formatClasses} ${className}`}
      >
        <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">
          Advertisement
        </span>
        <ins
          ref={adRef}
          className="adsbygoogle block w-full"
          data-ad-client={clientId}
          data-ad-slot={effectiveSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Helpful tip card when ads are not configured
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#1a1916]/80 border border-zinc-800/70 p-3 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${formatClasses} ${className}`}
    >
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
          <Lightbulb size={16} />
        </div>
        <div>
          <div className="text-xs font-bold text-zinc-200">
            Keyboard Shortcuts & Tips
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Use <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-300">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-300">→</kbd> to step moves, <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-[10px] text-zinc-300">Space</kbd> to flip board.
          </div>
        </div>
      </div>

      <a
        href="https://github.com/jtak93/chess-tutor"
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all shadow-sm group"
      >
        <GithubIcon size={13} className="text-zinc-400 group-hover:text-zinc-100" />
        <span>Star on GitHub</span>
        <Star size={11} className="text-amber-400 fill-amber-400" />
      </a>
    </div>
  );
};
