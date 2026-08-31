import React, { useState } from 'react';
import type { CoachPersona } from '../types/chess';
import { getStoredApiKey, setStoredApiKey, setStoredPersona } from '../services/geminiCoach';
import { clearAllGameCache, getCachedGamesIndex } from '../services/gameCache';
import { X, Key, Bot, Settings, Sliders, ExternalLink, Database, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: CoachPersona;
  onChangePersona: (persona: CoachPersona) => void;
  engineDepth: number;
  onChangeEngineDepth: (depth: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  showEngineArrow: boolean;
  onToggleEngineArrow: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  persona,
  onChangePersona,
  engineDepth,
  onChangeEngineDepth,
  soundEnabled,
  onToggleSound,
  showEngineArrow,
  onToggleEngineArrow,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(getStoredApiKey());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState<boolean>(false);
  const cachedGames = getCachedGamesIndex();

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    setStoredApiKey(apiKeyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSelectPersona = (p: CoachPersona) => {
    onChangePersona(p);
    setStoredPersona(p);
  };

  const handleClearCache = () => {
    clearAllGameCache();
    setCacheClearedSuccess(true);
    setTimeout(() => setCacheClearedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e1d1a] border border-zinc-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Settings & AI Tutor</h2>
              <div className="text-xs text-zinc-400">Configure Gemini API key, Stockfish depth & local cache</div>
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
        <div className="p-5 space-y-5 text-xs text-zinc-300">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Key size={14} className="text-teal-400" />
                Gemini API Key (for AI Coach commentary & chat)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
              >
                Get Key <ExternalLink size={10} />
              </a>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-colors"
              >
                {savedSuccess ? 'Saved!' : 'Save'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              Stored locally in your browser. If empty, built-in tactical rules provide instant offline commentary.
            </p>
          </div>

          {/* Coach Persona */}
          <div className="space-y-2">
            <label className="font-bold text-zinc-200 flex items-center gap-1.5">
              <Bot size={14} className="text-emerald-400" />
              Coach Personality
            </label>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'grandmaster', title: 'Grandmaster Mentor', desc: 'Encouraging, instructional, and strategic principles' },
                { id: 'strict', title: 'Strict Master Boris', desc: 'Direct, no-nonsense tactical discipline' },
                { id: 'friendly', title: 'Coach Emma', desc: 'Warm, beginner-friendly, simple analogies' },
                { id: 'witty', title: 'Coach Blitz', desc: 'Energetic, witty chess streamer vibes' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPersona(p.id as CoachPersona)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    persona === p.id
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold text-zinc-100 text-xs mb-0.5">{p.title}</div>
                  <div className="text-[11px] text-zinc-400 leading-tight">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Engine Depth Slider */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-400" />
                Stockfish Engine Depth
              </label>
              <span className="font-mono font-bold text-emerald-400 text-xs">{engineDepth}</span>
            </div>
            <input
              type="range"
              min={10}
              max={18}
              value={engineDepth}
              onChange={(e) => onChangeEngineDepth(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>Fast (10)</span>
              <span>Balanced (13-14)</span>
              <span>Deep (18)</span>
            </div>
          </div>

          {/* Game Cache Storage Manager */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Database size={14} className="text-emerald-400" />
                Local Storage Game Cache
              </label>
              <span className="text-[11px] text-zinc-400 font-mono">
                {cachedGames.length} {cachedGames.length === 1 ? 'game' : 'games'} saved
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Analyzed games are cached locally in your browser for instant 0ms reopening without re-running the engine.
            </p>

            <button
              type="button"
              onClick={handleClearCache}
              disabled={cachedGames.length === 0}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-red-400 border border-zinc-700 disabled:opacity-40 flex items-center gap-1.5 text-xs transition-colors"
            >
              <Trash2 size={13} />
              <span>{cacheClearedSuccess ? 'Cache Cleared!' : 'Clear All Cached Game Reviews'}</span>
            </button>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-zinc-200">Move Sound Effects</span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={onToggleSound}
                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold text-zinc-200">Show Best Move Arrows</span>
              <input
                type="checkbox"
                checked={showEngineArrow}
                onChange={onToggleEngineArrow}
                className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
