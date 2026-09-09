import React from 'react';
import { X, FileText } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e1d1a] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Terms of Service</h2>
              <div className="text-xs text-zinc-400">Last updated: September 2026</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-zinc-300 leading-relaxed">
          <section className="space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-100">1. Acceptance of Terms</h3>
            <p>
              By accessing and using Chess Tutor, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-100">2. Disclaimers & Non-Affiliation</h3>
            <p>
              Chess Tutor is an independent open-source educational chess tool. It is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Chess.com LLC, FIDE, or Lichess.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-100">3. Permitted Use</h3>
            <p>
              You agree to use this application only for lawful, educational, and recreational chess study. You agree not to use this tool for live game assistance in competitive tournaments where external engine assistance is prohibited.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-100">4. Modifications to Service</h3>
            <p>
              We reserve the right to modify, update, or discontinue any feature of the application without prior notice.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
