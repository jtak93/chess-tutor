import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  slotId?: string;
  format?: 'horizontal' | 'rectangle' | 'responsive';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slotId,
  format = 'horizontal',
  className = '',
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef<boolean>(false);

  useEffect(() => {
    // Only attempt to push to AdSense if client-id / slot-id is provided and window.adsbygoogle is loaded
    if (slotId && !isInitialized.current && typeof window !== 'undefined') {
      try {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
        isInitialized.current = true;
      } catch (err) {
        console.debug('AdSense script not loaded yet or ad blocked:', err);
      }
    }
  }, [slotId]);

  // Dimension classes based on format to prevent Cumulative Layout Shift (CLS)
  const formatClasses = (() => {
    switch (format) {
      case 'rectangle':
        return 'w-full max-w-[300px] min-h-[250px] mx-auto';
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
        Advertisement
      </span>

      {slotId ? (
        <ins
          ref={adRef}
          className="adsbygoogle block w-full"
          data-ad-client="ca-pub-0000000000000000" // Replace with your AdSense publisher ID in production
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        /* Clean Placeholder Banner for Development / Preview */
        <div className="flex flex-col items-center justify-center text-center p-3 w-full border border-dashed border-zinc-800 rounded-lg bg-zinc-900/40">
          <div className="text-xs font-semibold text-zinc-400">Ad Space</div>
          <div className="text-[10px] text-zinc-600 mt-0.5">
            {format === 'rectangle' ? '300 × 250 Medium Rectangle' : '728 × 90 Leaderboard'}
          </div>
        </div>
      )}
    </div>
  );
};
