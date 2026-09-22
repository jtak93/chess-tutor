import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPrivacy?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onOpenPrivacy }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('chess_tutor_cookie_consent');
      if (!consent) {
        // Show after a brief delay for smoother UX
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('chess_tutor_cookie_consent', 'accepted');
    } catch {}
    setIsVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('chess_tutor_cookie_consent', 'declined');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slideUp">
      <div className="p-4 rounded-2xl bg-[#1e1d1a] border border-zinc-700/80 shadow-2xl backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Cookie size={18} />
            <span>Cookie & Privacy Choices</span>
          </div>
          <button
            onClick={handleDecline}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          We use cookies and local storage to save your game reviews, remember your preferences, and serve relevant non-intrusive ads that keep Chess Tutor 100% free forever.{' '}
          {onOpenPrivacy && (
            <button
              onClick={onOpenPrivacy}
              className="text-emerald-400 hover:underline inline font-medium"
            >
              Learn more in our Privacy Policy
            </button>
          )}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
          <button
            onClick={handleDecline}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            Essential Only
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-emerald-900/30 transition-all flex items-center gap-1.5"
          >
            <ShieldCheck size={14} />
            <span>Accept All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
