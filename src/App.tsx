import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { Arrow } from 'react-chessboard';
import type {
  CoachPersona,
  GameReviewReport,
  LiveAnalysisUpdate,
  LiveEngineLine,
  LiveMoveItem,
} from './types/chess';
import { SAMPLE_GAMES } from './data/sampleGames';
import { analyzeGame } from './services/analyzer';
import { getStoredPersona } from './services/geminiCoach';
import { getCachedGameReport, setCachedGameReport } from './services/gameCache';
import { liveEngine } from './services/liveEngine';

import { ChessboardArea } from './components/ChessboardArea';
import { EvaluationBar } from './components/EvaluationBar';
import { EvaluationGraph } from './components/EvaluationGraph';
import { MoveList } from './components/MoveList';
import { CoachPanel } from './components/CoachPanel';
import { GameReviewHeader } from './components/GameReviewHeader';
import { GameReviewSummary } from './components/GameReviewSummary';
import { ImportGameModal } from './components/ImportGameModal';
import { SettingsModal } from './components/SettingsModal';
import { AnalysisLoadingModal } from './components/AnalysisLoadingModal';
import { KeyMomentsBar } from './components/KeyMomentsBar';
import { LiveAnalysisPanel } from './components/LiveAnalysisPanel';
import { AdBanner } from './components/AdBanner';
import { Footer } from './components/Footer';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { TermsModal } from './components/TermsModal';
import { ErrorBoundary } from './components/ErrorBoundary';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  Upload,
  Settings,
  Sparkles,
  Gamepad2,
  Activity,
  Bot,
  ListOrdered,
} from 'lucide-react';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type RightPanelTab = 'coach' | 'engine' | 'moves';

interface ActiveVariationState {
  basePly: number;
  moves: LiveMoveItem[];
  currentFen: string;
}

export const App: React.FC = () => {
  // Review Report State
  const [report, setReport] = useState<GameReviewReport | null>(null);
  const [currentPly, setCurrentPly] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [isRetryMode, setIsRetryMode] = useState<boolean>(false);

  // Right Panel Tab Selection: 'coach' | 'engine' | 'moves'
  const [activeTab, setActiveTab] = useState<RightPanelTab>('coach');

  // Guided Key Moments Walkthrough state
  const [isKeyMomentsMode, setIsKeyMomentsMode] = useState<boolean>(false);
  const [keyMomentIndex, setKeyMomentIndex] = useState<number>(0);
  const [keyMomentSolved, setKeyMomentSolved] = useState<boolean>(false);

  // Live Variation State (When user drags pieces on the board to test alternative lines)
  const [activeVariation, setActiveVariation] = useState<ActiveVariationState | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<LiveAnalysisUpdate | null>(null);
  const [isPlayEngineMode, setIsPlayEngineMode] = useState<boolean>(false);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);

  // Engine & Coach settings
  const [persona, setPersona] = useState<CoachPersona>(getStoredPersona());
  const [engineDepth, setEngineDepth] = useState<number>(13);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showEngineArrow, setShowEngineArrow] = useState<boolean>(true);

  // Analysis progress
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [currentAnalyzingPly, setCurrentAnalyzingPly] = useState<number>(0);
  const [totalAnalyzingPlies, setTotalAnalyzingPlies] = useState<number>(0);

  const playIntervalRef = useRef<any>(null);

  // Filter key moments for guided review
  const keyMoments = useMemo(() => {
    if (!report || !report.moves) return [];
    return report.moves.filter(
      (m) => ['blunder', 'miss', 'mistake', 'brilliant', 'great'].includes(m.classification) || m.keyMoment
    );
  }, [report]);

  // Determine current active FEN (either variation FEN or game move FEN)
  const gameFen = useMemo(() => {
    if (!report || !report.moves || report.moves.length === 0) return START_FEN;
    if (currentPly <= -1) return report.moves[0]?.fenBefore || START_FEN;
    const safePly = Math.min(report.moves.length - 1, Math.max(0, currentPly));
    return report.moves[safePly]?.fenAfter || START_FEN;
  }, [report, currentPly]);

  const activeFen = activeVariation ? activeVariation.currentFen : gameFen;

  // Stream Live Engine analysis for active position whenever engine tab is open or variation is being explored
  useEffect(() => {
    if (activeVariation || activeTab === 'engine' || !report) {
      liveEngine.startAnalysis(activeFen, 18, (update) => {
        setLiveAnalysis(update);
      });
    } else {
      liveEngine.stop();
    }
  }, [activeFen, activeVariation, activeTab, report]);

  // Handle Play Against Engine in live variations
  useEffect(() => {
    if (activeVariation && isPlayEngineMode && liveAnalysis && !liveAnalysis.isSearching && liveAnalysis.bestMoveUci) {
      const turn = activeVariation.currentFen.split(' ')[1] as 'w' | 'b';
      const playerColor = orientation === 'white' ? 'w' : 'b';

      if (turn !== playerColor && liveAnalysis.bestMoveUci.length >= 4) {
        const timer = setTimeout(() => {
          try {
            const chess = new Chess(activeVariation.currentFen);
            const from = liveAnalysis.bestMoveUci.substring(0, 2) as Square;
            const to = liveAnalysis.bestMoveUci.substring(2, 4) as Square;
            const promotion = liveAnalysis.bestMoveUci.length > 4 ? liveAnalysis.bestMoveUci[4] : undefined;

            const move = chess.move({ from, to, promotion });
            if (move) {
              const newFen = chess.fen();
              const newMoves: LiveMoveItem[] = [
                ...activeVariation.moves,
                {
                  ply: activeVariation.moves.length,
                  moveNumber: Math.floor(activeVariation.moves.length / 2) + 1,
                  turn: move.color,
                  san: move.san,
                  uci: liveAnalysis.bestMoveUci,
                  from: move.from,
                  to: move.to,
                  piece: move.piece,
                  captured: move.captured,
                  promotion: move.promotion,
                  fenBefore: activeVariation.currentFen,
                  fenAfter: newFen,
                },
              ];

              setActiveVariation({
                basePly: activeVariation.basePly,
                moves: newMoves,
                currentFen: newFen,
              });
            }
          } catch {
            // Ignore
          }
        }, 600);

        return () => clearTimeout(timer);
      }
    }
  }, [activeVariation, isPlayEngineMode, liveAnalysis, orientation]);

  const handleLoadAndAnalyzePgn = useCallback(
    async (pgn: string, forceReanalyze: boolean = false) => {
      setActiveVariation(null);
      setIsKeyMomentsMode(false);

      if (!forceReanalyze) {
        const cached = getCachedGameReport(pgn);
        if (cached && cached.moves && cached.moves.length > 0) {
          setReport(cached);
          setCurrentPly(0);
          setIsRetryMode(false);
          setIsPlaying(false);
          return;
        }
      }

      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setCurrentAnalyzingPly(0);
      setIsRetryMode(false);
      setIsPlaying(false);

      try {
        const result = await analyzeGame(pgn, engineDepth, (progress, curr, total) => {
          setAnalysisProgress(progress);
          setCurrentAnalyzingPly(curr);
          setTotalAnalyzingPlies(total);
        });

        setCachedGameReport(pgn, result);
        setReport(result);
        setCurrentPly(0);
      } catch (err) {
        console.error('Game analysis error:', err);
        alert('Failed to parse or analyze this game. Please check the PGN format.');
      } finally {
        setIsAnalyzing(false);
      }
    },
    [engineDepth]
  );

  const handleLoadCachedKey = useCallback((cacheKey: string) => {
    try {
      const data = localStorage.getItem(cacheKey);
      if (data) {
        const cachedReport = JSON.parse(data) as GameReviewReport;
        if (cachedReport && cachedReport.moves) {
          setReport(cachedReport);
          setCurrentPly(0);
          setIsRetryMode(false);
          setIsPlaying(false);
          setIsKeyMomentsMode(false);
          setActiveVariation(null);
        }
      }
    } catch (err) {
      console.warn('Failed to load game from cache key:', err);
    }
  }, []);

  const handleStartKeyMoments = useCallback(() => {
    if (keyMoments.length === 0) return;
    setActiveVariation(null);
    setIsKeyMomentsMode(true);
    setKeyMomentIndex(0);
    setKeyMomentSolved(false);

    const first = keyMoments[0];
    setCurrentPly(first.ply);

    const isMistake = ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(first.classification);
    setIsRetryMode(isMistake);
  }, [keyMoments]);

  const handleSelectKeyMomentIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= keyMoments.length) return;
      setActiveVariation(null);
      setKeyMomentIndex(index);
      setKeyMomentSolved(false);

      const target = keyMoments[index];
      setCurrentPly(target.ply);

      const isMistake = ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(target.classification);
      setIsRetryMode(isMistake);
    },
    [keyMoments]
  );

  const handleFirstMove = useCallback(() => {
    setIsPlaying(false);
    setIsRetryMode(false);
    setIsKeyMomentsMode(false);
    setActiveVariation(null);
    setCurrentPly(-1);
  }, []);

  const handlePrevMove = useCallback(() => {
    setIsPlaying(false);
    setIsRetryMode(false);
    setIsKeyMomentsMode(false);
    if (activeVariation) {
      if (activeVariation.moves.length > 1) {
        const trimmed = activeVariation.moves.slice(0, -1);
        const last = trimmed[trimmed.length - 1];
        setActiveVariation({
          basePly: activeVariation.basePly,
          moves: trimmed,
          currentFen: last.fenAfter,
        });
      } else {
        setActiveVariation(null);
      }
      return;
    }
    setCurrentPly((prev) => Math.max(-1, prev - 1));
  }, [activeVariation]);

  const handleNextMove = useCallback(() => {
    setIsPlaying(false);
    setIsRetryMode(false);
    setIsKeyMomentsMode(false);
    if (activeVariation) {
      setActiveVariation(null);
    }
    if (report && report.moves) {
      setCurrentPly((prev) => Math.min(report.moves.length - 1, prev + 1));
    }
  }, [report, activeVariation]);

  const handleLastMove = useCallback(() => {
    setIsPlaying(false);
    setIsRetryMode(false);
    setIsKeyMomentsMode(false);
    setActiveVariation(null);
    if (report && report.moves) {
      setCurrentPly(report.moves.length - 1);
    }
  }, [report]);

  const handleTogglePlay = useCallback(() => {
    setActiveVariation(null);
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSelectPly = useCallback((ply: number) => {
    setIsPlaying(false);
    setIsRetryMode(false);
    setIsKeyMomentsMode(false);
    setActiveVariation(null);
    setCurrentPly(ply);
  }, []);

  // Handle piece drop on board: if move matches next game move, step forward; otherwise, explore variation live!
  const handlePieceDropAction = useCallback(
    (source: Square, target: Square, promotion?: string): boolean => {
      try {
        const boardFen = activeVariation ? activeVariation.currentFen : gameFen;
        const chess = new Chess(boardFen);
        const move = chess.move({
          from: source,
          to: target,
          promotion: promotion || undefined,
        });

        if (!move) return false;

        const nextFen = chess.fen();
        const playedUci = `${source}${target}${promotion || ''}`;

        // Check if move matches the actual game's next move
        const nextGameMove = report && currentPly + 1 < report.moves.length ? report.moves[currentPly + 1] : null;
        if (!activeVariation && nextGameMove && (nextGameMove.uci === playedUci || nextGameMove.san === move.san)) {
          setCurrentPly((prev) => prev + 1);
          return true;
        }

        // Otherwise: Create or append to the live variation branch!
        const newMoveItem: LiveMoveItem = {
          ply: activeVariation ? activeVariation.moves.length : 0,
          moveNumber: Math.floor((activeVariation ? activeVariation.moves.length : 0) / 2) + 1,
          turn: move.color,
          san: move.san,
          uci: playedUci,
          from: source,
          to: target,
          piece: move.piece,
          captured: move.captured,
          promotion: move.promotion,
          fenBefore: boardFen,
          fenAfter: nextFen,
        };

        setActiveVariation((prev) => ({
          basePly: prev ? prev.basePly : currentPly,
          moves: prev ? [...prev.moves, newMoveItem] : [newMoveItem],
          currentFen: nextFen,
        }));

        // Automatically open engine lines tab so the user sees live calculation
        setActiveTab('engine');
        return true;
      } catch {
        return false;
      }
    },
    [activeVariation, gameFen, report, currentPly]
  );

  // Play a candidate preview line
  const handlePreviewLiveLine = useCallback(
    (line: LiveEngineLine) => {
      if (!line.uci || line.uci.length < 4) return;
      const from = line.uci.substring(0, 2) as Square;
      const to = line.uci.substring(2, 4) as Square;
      const promotion = line.uci.length > 4 ? line.uci[4] : undefined;
      handlePieceDropAction(from, to, promotion);
    },
    [handlePieceDropAction]
  );

  // MultiPV candidate colored arrows
  const liveCandidateArrows = useMemo<Arrow[]>(() => {
    if (!liveAnalysis?.topLines) return [];
    const arrows: Arrow[] = [];
    const colors = [
      'rgba(129, 182, 76, 0.9)', // Rank 1: Emerald Green
      'rgba(34, 211, 238, 0.85)', // Rank 2: Cyan
      'rgba(251, 191, 36, 0.8)', // Rank 3: Amber
    ];

    liveAnalysis.topLines.forEach((line, idx) => {
      if (line.uci && line.uci.length >= 4) {
        const from = line.uci.substring(0, 2);
        const to = line.uci.substring(2, 4);
        arrows.push({
          startSquare: from,
          endSquare: to,
          color: colors[idx] || colors[0],
        });
      }
    });

    return arrows;
  }, [liveAnalysis]);

  // Handle browser back button / popstate gracefully
  useEffect(() => {
    const handlePopState = () => {
      if (isImportModalOpen || isSettingsModalOpen || isSummaryModalOpen || isPrivacyModalOpen || isTermsModalOpen) {
        setIsImportModalOpen(false);
        setIsSettingsModalOpen(false);
        setIsSummaryModalOpen(false);
        setIsPrivacyModalOpen(false);
        setIsTermsModalOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isImportModalOpen, isSettingsModalOpen, isSummaryModalOpen, isPrivacyModalOpen, isTermsModalOpen]);

  useEffect(() => {
    if (isPlaying && report && report.moves) {
      playIntervalRef.current = setInterval(() => {
        setCurrentPly((prev) => {
          if (prev >= report.moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, report]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevMove();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMove();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleFirstMove();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleLastMove();
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key.toLowerCase() === 'x') {
        setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevMove, handleNextMove, handleFirstMove, handleLastMove, handleTogglePlay]);

  const currentMove =
    !activeVariation && report && report.moves && currentPly >= 0 && currentPly < report.moves.length
      ? report.moves[currentPly]
      : null;

  const currentEval = (() => {
    if (activeVariation && liveAnalysis?.evaluation) {
      return liveAnalysis.evaluation;
    }
    if (!report || !report.moves || report.moves.length === 0) {
      return liveAnalysis?.evaluation || { type: 'cp' as const, value: 0, whiteValue: 0, depth: 0 };
    }
    if (currentPly <= -1) {
      return report.moves[0]?.evalBefore || { type: 'cp' as const, value: 0, whiteValue: 0, depth: 0 };
    }
    const safePly = Math.min(report.moves.length - 1, Math.max(0, currentPly));
    return report.moves[safePly]?.evalAfter || { type: 'cp' as const, value: 0, whiteValue: 0, depth: 0 };
  })();

  const variationMoveSans = activeVariation ? activeVariation.moves.map((m) => m.san) : [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#121211] text-zinc-100 flex flex-col font-sans select-none">
        {/* Top Navigation Bar */}
        <header className="border-b border-zinc-800/80 bg-[#1a1917] px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-base shadow">
              ♟
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight flex items-center gap-1.5 text-zinc-100">
                <span>Chess Tutor</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  PRO
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Sample Selector & Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <select
                onChange={(e) => {
                  const selected = SAMPLE_GAMES.find((g) => g.id === e.target.value);
                  if (selected) handleLoadAndAnalyzePgn(selected.pgn);
                }}
                defaultValue=""
                className="bg-zinc-800/90 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="" disabled>
                  ⚡ Load Sample Game...
                </option>
                {SAMPLE_GAMES.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow hover:scale-105"
            >
              <Upload size={14} />
              <span>Import PGN</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Main Workspace Layout */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 flex flex-col gap-3">
          {/* Game Header with Players, Accuracy, and Performance ELO */}
          <GameReviewHeader
            report={report}
            onOpenSummary={() => setIsSummaryModalOpen(true)}
            onOpenImport={() => setIsImportModalOpen(true)}
            onStartKeyMoments={handleStartKeyMoments}
            isKeyMomentsActive={isKeyMomentsMode}
          />

          {/* Guided Key Moments Walkthrough Bar if Active */}
          {isKeyMomentsMode && keyMoments.length > 0 && !activeVariation && (
            <KeyMomentsBar
              keyMoments={keyMoments}
              currentIndex={keyMomentIndex}
              onSelectIndex={handleSelectKeyMomentIndex}
              onExit={() => {
                setIsKeyMomentsMode(false);
                setIsRetryMode(false);
              }}
              onShowHint={() => setShowEngineArrow(true)}
              isSolved={keyMomentSolved}
            />
          )}

          {/* Board, Eval Bar, and Right Workspace Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-start">
            {/* Left Column: Eval Bar + Interactive Board (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                {/* Vertical Evaluation Bar */}
                <EvaluationBar
                  evaluation={currentEval}
                  orientation={orientation}
                  height="h-[320px] sm:h-[480px] md:h-[520px]"
                />

                {/* Chessboard Area (Always interactive with live variation support) */}
                <ChessboardArea
                  currentMove={currentMove}
                  fen={activeFen}
                  orientation={orientation}
                  onFlipBoard={() =>
                    setOrientation((prev) => (prev === 'white' ? 'black' : 'white'))
                  }
                  showEngineArrow={showEngineArrow}
                  isRetryMode={isRetryMode}
                  onExitRetryMode={() => setIsRetryMode(false)}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled((prev) => !prev)}
                  isVariationActive={Boolean(activeVariation)}
                  variationMoves={variationMoveSans}
                  onExitVariation={() => setActiveVariation(null)}
                  liveCandidateArrows={liveCandidateArrows}
                  onPieceDropAction={handlePieceDropAction}
                />
              </div>

              {/* Playback & Navigation Controls */}
              <div className="flex items-center justify-between w-full max-w-[540px] bg-[#1e1d1a] border border-zinc-800 p-2 rounded-xl shadow-md">
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handleFirstMove}
                    disabled={currentPly <= -1 && !activeVariation}
                    className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
                    title="First Move (Up Arrow)"
                  >
                    <ChevronsLeft size={18} />
                  </button>

                  <button
                    onClick={handlePrevMove}
                    disabled={currentPly <= -1 && !activeVariation}
                    className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
                    title="Previous Move (Left Arrow)"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    onClick={handleTogglePlay}
                    disabled={!report}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold transition-all shadow hover:scale-105 flex items-center gap-1.5 text-xs"
                    title="Play / Pause (Space)"
                  >
                    {isPlaying ? <Pause size={15} /> : <Play size={15} className="fill-white" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={handleNextMove}
                    disabled={!report || !report.moves || currentPly >= report.moves.length - 1}
                    className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
                    title="Next Move (Right Arrow)"
                  >
                    <ChevronRight size={20} />
                  </button>

                  <button
                    onClick={handleLastMove}
                    disabled={!report || !report.moves || currentPly >= report.moves.length - 1}
                    className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
                    title="Last Move (Down Arrow)"
                  >
                    <ChevronsRight size={18} />
                  </button>
                </div>

                {activeVariation ? (
                  <button
                    onClick={() => setActiveVariation(null)}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow"
                  >
                    Back to Game Move
                  </button>
                ) : (
                  <div className="text-[11px] text-zinc-400 font-mono hidden sm:block">
                    Drag any piece to test what-if lines
                  </div>
                )}
              </div>

              {/* Evaluation Advantage Graph (Review Mode) */}
              {report && report.moves && report.moves.length > 0 && (
                <div className="w-full max-w-[540px]">
                  <EvaluationGraph
                    moves={report.moves}
                    currentPly={currentPly}
                    onSelectPly={handleSelectPly}
                  />
                </div>
              )}

              {/* Leaderboard Ad Slot */}
              <div className="w-full max-w-[540px] pt-1">
                <AdBanner format="horizontal" />
              </div>
            </div>

            {/* Right Column: Unified Right Workspace Tabs (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-2 h-full">
              {/* Workspace Navigation Tabs */}
              <div className="flex items-center gap-1 bg-[#1e1d1a] border border-zinc-800 p-1 rounded-xl shadow">
                <button
                  onClick={() => setActiveTab('coach')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'coach'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Bot size={14} />
                  <span>AI Coach</span>
                </button>

                <button
                  onClick={() => setActiveTab('engine')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'engine'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Activity size={14} className={liveAnalysis?.isSearching ? 'animate-spin' : ''} />
                  <span>Live Lines</span>
                </button>

                <button
                  onClick={() => setActiveTab('moves')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'moves'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ListOrdered size={14} />
                  <span>Moves {report ? `(${report.moves.length})` : ''}</span>
                </button>
              </div>

              {/* Active Tab Panel Content */}
              <div className="min-h-[460px] sm:min-h-[520px]">
                {activeTab === 'coach' && (
                  <CoachPanel
                    currentMove={currentMove}
                    currentFen={activeFen}
                    persona={persona}
                    onRetryMove={() => setIsRetryMode(true)}
                  />
                )}

                {activeTab === 'engine' && (
                  <LiveAnalysisPanel
                    analysis={liveAnalysis}
                    currentFen={activeFen}
                    onPreviewLine={handlePreviewLiveLine}
                    persona={persona}
                    onResetToStart={() => setActiveVariation(null)}
                    isPlayEngineMode={isPlayEngineMode}
                    onTogglePlayEngine={() => setIsPlayEngineMode((prev) => !prev)}
                  />
                )}

                {activeTab === 'moves' && (
                  report && report.moves ? (
                    <MoveList
                      moves={report.moves}
                      currentPly={currentPly}
                      onSelectPly={handleSelectPly}
                    />
                  ) : (
                    <div className="h-full bg-[#1e1d1a] border border-zinc-800 rounded-xl p-5 flex flex-col items-center justify-center text-center space-y-3 shadow-md">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Gamepad2 size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200">No Game Loaded</div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          Import a PGN to view the full move review table.
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadAndAnalyzePgn(SAMPLE_GAMES[0].pgn)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1 transition-colors"
                      >
                        <Sparkles size={12} className="text-emerald-400" />
                        Review User Game
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer with Privacy Policy & Terms */}
        <Footer
          onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
          onOpenTerms={() => setIsTermsModalOpen(true)}
        />

        {/* Modals */}
        <ImportGameModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onLoadPgn={handleLoadAndAnalyzePgn}
          onLoadCachedGame={handleLoadCachedKey}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          persona={persona}
          onChangePersona={setPersona}
          engineDepth={engineDepth}
          onChangeEngineDepth={setEngineDepth}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          showEngineArrow={showEngineArrow}
          onToggleEngineArrow={() => setShowEngineArrow((prev) => !prev)}
        />

        {report && (
          <GameReviewSummary
            report={report}
            isOpen={isSummaryModalOpen}
            onClose={() => setIsSummaryModalOpen(false)}
            onSelectPly={handleSelectPly}
            onStartKeyMoments={handleStartKeyMoments}
          />
        )}

        <AnalysisLoadingModal
          isOpen={isAnalyzing}
          progress={analysisProgress}
          currentPly={currentAnalyzingPly}
          totalPlies={totalAnalyzingPlies}
        />

        <PrivacyPolicyModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
        />

        <TermsModal
          isOpen={isTermsModalOpen}
          onClose={() => setIsTermsModalOpen(false)}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
