import React, { useState } from 'react';
import type { GameReviewReport } from '../types/chess';
import {
  encodeGameToUrl,
  exportAnnotatedPgn,
  downloadScorecardImage,
} from '../services/shareService';
import {
  Share2,
  Copy,
  Check,
  FileText,
  Image,
  X,
  ExternalLink,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: GameReviewReport | null;
  rawPgn?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  report,
  rawPgn,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedPgn, setCopiedPgn] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  if (!isOpen || !report) return null;

  const shareUrl = encodeGameToUrl(rawPgn || '');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyAnnotatedPgn = async () => {
    try {
      const pgnText = exportAnnotatedPgn(report);
      await navigator.clipboard.writeText(pgnText);
      setCopiedPgn(true);
      setTimeout(() => setCopiedPgn(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadScorecard = async () => {
    setIsGeneratingImage(true);
    try {
      const filename = `${report.metadata.white || 'White'}_vs_${report.metadata.black || 'Black'}_Review.png`.replace(/\s+/g, '_');
      await downloadScorecardImage(report, filename);
    } catch (err) {
      console.error('Failed to generate scorecard:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const tweetText = `Just analyzed my chess game on Chess Tutor! White: ${report.whiteAccuracy}% • Black: ${report.blackAccuracy}%. Check it out:`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`[Game Review] ${report.metadata.white} vs ${report.metadata.black} (${report.whiteAccuracy}% vs ${report.blackAccuracy}%)`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#1e1d1a] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
            <Share2 size={18} />
            <span className="text-zinc-100">Share Game Review</span>
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
          {/* Shareable Link Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
              <span>Direct Review Link</span>
              <span className="text-[10px] text-zinc-500 font-normal">Works instantly for anyone</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all shrink-0"
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social Quick Share */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={redditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-orange-950/30 hover:bg-orange-900/40 border border-orange-700/40 text-orange-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <span>Post to Reddit (r/chess)</span>
              <ExternalLink size={12} />
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-sky-950/30 hover:bg-sky-900/40 border border-sky-700/40 text-sky-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <span>Share to X / Twitter</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="border-t border-zinc-800 pt-3 space-y-2">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Export Formats
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Scorecard PNG */}
              <button
                onClick={handleDownloadScorecard}
                disabled={isGeneratingImage}
                className="p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 flex flex-col items-start gap-1 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Image size={15} />
                  <span>Download Scorecard PNG</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-tight">
                  High-res image with accuracies, ELO, and brilliance counts.
                </div>
              </button>

              {/* Annotated PGN */}
              <button
                onClick={handleCopyAnnotatedPgn}
                className="p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 flex flex-col items-start gap-1 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                  <FileText size={15} />
                  <span>{copiedPgn ? 'Annotated PGN Copied!' : 'Copy Annotated PGN'}</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-tight">
                  PGN with embedded Stockfish evals, NAG glyphs & coach notes.
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
