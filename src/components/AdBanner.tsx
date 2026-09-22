import React, { useEffect, useRef } from 'react';
import { Sparkles, Heart } from 'lucide-react';

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
  onOpenSupport,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef<boolean>(false);

  const clientId = (import.meta as any).env?.VITE_ADSENSE_CLIENT_ID || '';
  const effectiveSlotId = slotId || (import.meta as any).env?.VITE_AD_SLOT_BANNER || '';

  useEffect(() => {
    // Only attempt to push to AdSense if client-id / slot-id is provided and window.adsbygoogle is loaded
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

  // Dimension classes based on format to prevent Cumulative Layout Shift (CLS)
  const formatClasses = (() => {
    switch (format) {
      case 'rectangle':
        return 'w-full max-w-[300px] min-h-[250px] mx-auto';
      case 'sidebar':
        return 'w-full min-h-[250px]';
      case 'feed':
        return 'w-full min-h-[100px]';
      case 'responsive':
        return 'w-full min-h-[90px]';
      case 'horizontal':
      default:
        return 'w-full max-w-[728px] min-h-[90px] mx-auto';
    }
  })();

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#1e1d1a]/80 border border-zinc-800/80 flex flex-col items-center justify-center p-2 transition-all ${formatClasses} ${className}`}
    >
      {/* Label */}
      <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">
        {clientId && effectiveSlotId ? 'Advertisement' : 'Sponsored & Partner Tools'}
      </span>

      {clientId && effectiveSlotId ? (
        <ins
          ref={adRef}
          className="adsbygoogle block w-full"
          data-ad-client={clientId}
          data-ad-slot={effectiveSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        /* High-Converting Fallback / Partner Promo Card */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 w-full rounded-lg bg-gradient-to-r from-zinc-900/90 via-[#24221d]/80 to-zinc-900/90 border border-zinc-800">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-200">
                100% Free & Unlimited Stockfish 18 Analysis
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                No subscription required. Enjoy CAPS2 accuracy and GM commentary forever.
              </div>
            </div>
          </div>

          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
            >
              <Heart size={13} className="text-pink-400" />
              <span>Support App</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
