import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e1d1a] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Privacy Policy</h2>
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
            <h3 className="font-bold text-sm text-zinc-100">1. Overview & Client-Side Architecture</h3>
            <p>
              Chess Tutor is designed with privacy-first principles. The Stockfish chess engine runs
              entirely within your browser's local Web Worker environment. Your chess moves and game
              analyses are stored locally on your device in your browser's <code className="text-emerald-400 font-mono">localStorage</code> and are not transmitted to any private database.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-100">2. Advertising & Third-Party Vendors</h3>
            <p>
              We use third-party advertising companies (such as Google AdSense and its partners) to serve ads when you visit our website.
              These companies may use cookies and web beacons to collect non-personally identifiable information (such as browser type, time and date, subject of advertisements clicked or scrolled over) to serve advertisements tailored to your interests.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-zinc-400">
              <li>Google, as a third-party vendor, uses cookies to serve ads on this site.</li>
              <li>Google's use of advertising cookies enables it and its partners to serve ads based on your visit to this and/or other sites on the Internet.</li>
              <li>
                Users may opt out of personalized advertising by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline hover:text-emerald-300"
                >
                  Google Ad Settings
                </a>{' '}
                or{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline hover:text-emerald-300"
                >
                  aboutads.info
                </a>.
              </li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-100">3. AI Coaching (Google Gemini API)</h3>
            <p>
              When requesting live conversational grandmaster coaching, game positions and user prompts are sent to the Google Gemini API to generate strategic feedback. No personal identifying information is attached to these requests.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-100">4. Cookies & Local Storage</h3>
            <p>
              We use browser Local Storage to remember your board preferences, coach persona, and previously reviewed game reports. You can clear this data at any time via the in-app Settings modal or through your browser settings.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-bold text-sm text-zinc-100">5. GDPR & CCPA Rights</h3>
            <p>
              Depending on your location, you may have rights under the European Union GDPR or California Consumer Privacy Act (CCPA) to access, delete, or limit the use of your data. As we do not maintain accounts or server-side databases of your personal identity, clearing your browser storage deletes all local data immediately.
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
