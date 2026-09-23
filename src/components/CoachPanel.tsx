import React, { useState, useEffect, useRef } from 'react';
import type { CoachPersona, MoveAnalysis } from '../types/chess';
import { CLASSIFICATION_CONFIG } from './BadgeIcon';
import { geminiCoachService, getStoredApiKey } from '../services/geminiCoach';
import { buildRichCoachCommentary } from '../services/tacticalReasoner';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  MessageSquare,
  Lightbulb,
  ShieldAlert,
  Compass,
} from 'lucide-react';

interface CoachPanelProps {
  currentMove: MoveAnalysis | null;
  currentFen: string;
  persona: CoachPersona;
  onRetryMove?: () => void;
  onSelectMoveSan?: (san: string) => void;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({
  currentMove,
  currentFen,
  persona,
  onRetryMove,
}) => {
  const [geminiExplanation, setGeminiExplanation] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'coach' | 'user'; text: string }[]>([]);
  const [sendingChat, setSendingChat] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const apiKey = getStoredApiKey();

  useEffect(() => {
    setGeminiExplanation('');
  }, [currentMove?.ply]);

  useEffect(() => {
    if (chatMessages.length > 0 || sendingChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length, sendingChat]);

  const handleRequestAiExplanation = async () => {
    if (!currentMove) return;
    setLoadingAi(true);
    try {
      const expl = await geminiCoachService.explainMove(currentMove, persona, apiKey);
      setGeminiExplanation(expl);
    } catch {
      setGeminiExplanation(currentMove.coachComment || '');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userText = chatInput.trim();
    setChatInput('');

    const newHistory = [...chatMessages, { sender: 'user' as const, text: userText }];
    setChatMessages(newHistory);
    setSendingChat(true);

    try {
      const coachReply = await geminiCoachService.askCoachQuestion(
        userText,
        currentMove,
        currentFen,
        newHistory,
        persona,
        apiKey
      );
      setChatMessages([...newHistory, { sender: 'coach' as const, text: coachReply }]);
    } catch (err) {
      console.error('Coach chat error:', err);
      setChatMessages([
        ...newHistory,
        {
          sender: 'coach' as const,
          text: 'Focus on piece coordination, controlling key central squares, and safeguarding your king.',
        },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  const config = currentMove
    ? CLASSIFICATION_CONFIG[currentMove.classification] || CLASSIFICATION_CONFIG.good
    : null;

  const isMistakeOrBlunder = currentMove && ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(currentMove.classification);

  const richFeedback = currentMove ? buildRichCoachCommentary(currentMove) : null;

  const getPersonaLabel = () => {
    switch (persona) {
      case 'strict':
        return 'Grandmaster Boris (Strict)';
      case 'friendly':
        return 'Coach Emma (Friendly)';
      case 'witty':
        return 'Coach Blitz (Witty)';
      default:
        return 'Grandmaster AI Coach';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1d1a] border border-zinc-800 rounded-xl overflow-hidden shadow-md">
      {/* Coach Header Banner */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md">
            <Bot size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
              <span>{getPersonaLabel()}</span>
              {apiKey && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  GEMINI AI
                </span>
              )}
            </div>
            <div className="text-[10px] text-zinc-400">Game Review & Real-time Analysis</div>
          </div>
        </div>

        {isMistakeOrBlunder && onRetryMove && (
          <button
            onClick={onRetryMove}
            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow transition-all hover:scale-105"
          >
            <RotateCcw size={12} />
            Retry
          </button>
        )}
      </div>

      {/* Main Move Assessment Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {currentMove && config && richFeedback ? (
          <div className="space-y-3">
            {/* Move Classification Banner */}
            <div
              className={`p-3 rounded-xl border ${config.bgClass} flex items-start justify-between shadow-sm`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold uppercase tracking-wide" style={{ color: config.hexColor }}>
                    {config.label}
                  </span>
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-black/30 text-zinc-200">
                    {currentMove.turn === 'w' ? 'White' : 'Black'} played {currentMove.san}
                  </span>
                </div>
                <div className="text-xs text-zinc-300 font-medium">
                  {richFeedback.headline}
                </div>
              </div>

              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white shadow shrink-0"
                style={{ backgroundColor: config.hexColor }}
              >
                {config.symbol}
              </div>
            </div>

            {/* Tactical Concept Tags */}
            {richFeedback.tacticalThemes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {richFeedback.tacticalThemes.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/80 flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Coach Commentary Text */}
            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 text-xs space-y-2.5 leading-relaxed text-zinc-200">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-semibold border-b border-zinc-800 pb-1.5">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Lightbulb size={13} />
                  Coach Analysis
                </span>
                {currentMove.winChanceDelta !== 0 && (
                  <span className={`font-mono ${currentMove.winChanceDelta > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {currentMove.winChanceDelta > 0 ? '+' : ''}
                    {currentMove.winChanceDelta.toFixed(1)}% Win Chance
                  </span>
                )}
              </div>

              <div className="text-zinc-200 leading-normal">
                {geminiExplanation || richFeedback.explanation}
              </div>

              {/* Best Move Comparison if Inaccuracy/Mistake/Blunder/Miss */}
              {isMistakeOrBlunder && currentMove.bestMoveSan && (
                <div className="p-2.5 rounded-lg bg-zinc-800/90 border border-zinc-700/80 flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <ShieldAlert size={12} className="text-amber-400" />
                      Engine Recommendation:
                    </span>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                      {currentMove.bestMoveSan}
                    </span>
                  </div>
                  {currentMove.bestLine && currentMove.bestLine.length > 1 && (
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Continuation: {currentMove.bestLine.slice(0, 4).join(' ')}
                    </div>
                  )}
                </div>
              )}

              {/* Strategic Takeaway Card */}
              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px] text-emerald-200 flex items-start gap-2">
                <Compass size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-emerald-300">Grandmaster Principle: </span>
                  {richFeedback.strategicTakeaway}
                </div>
              </div>

              {/* Generate deeper Gemini explanation button if not loaded yet */}
              {!geminiExplanation && apiKey && (
                <button
                  onClick={handleRequestAiExplanation}
                  disabled={loadingAi}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-zinc-700"
                >
                  <Sparkles size={13} className="text-teal-400" />
                  {loadingAi ? 'Grandmaster AI is calculating...' : 'Ask AI for Deep Tactical Breakdown'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-500 text-xs space-y-2">
            <Bot size={32} className="mx-auto text-zinc-600" />
            <div>Select any move or start game review to see coach feedback.</div>
          </div>
        )}

        {/* Interactive Ask Coach Chat History */}
        {chatMessages.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
              <MessageSquare size={12} />
              Tutor Discussion
            </div>
            {chatMessages.map((msg, idx) => (
              <div
                key={`msg-${idx}`}
                className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-zinc-800 text-zinc-100 ml-4 border border-zinc-700/50'
                    : 'bg-emerald-950/30 text-emerald-100 mr-4 border border-emerald-800/30'
                }`}
              >
                <div className="text-[10px] font-bold text-zinc-400 mb-0.5">
                  {msg.sender === 'user' ? 'You' : 'Coach'}
                </div>
                <div>{msg.text}</div>
              </div>
            ))}

            {/* Live Thinking Indicator */}
            {sendingChat && (
              <div className="p-2 rounded-xl bg-emerald-950/20 text-emerald-300 text-xs mr-4 border border-emerald-800/20 flex items-center gap-2 animate-pulse">
                <Bot size={13} />
                <span>Coach is thinking...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Ask Coach Input Bar */}
      <form onSubmit={handleSendChat} className="p-2 border-t border-zinc-800 bg-zinc-900/60 flex items-center gap-1.5">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask coach (e.g. 'Why is f3 weak?', 'What was my plan?')..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          disabled={sendingChat}
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || sendingChat}
          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors shadow"
          title="Send question to Coach"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
