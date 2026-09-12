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
  ExternalLink,
  BookOpen,
} from 'lucide-react';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type ViewMode = 'review' | 'live_studio';
type RightPanelTab = 'coach' | 'engine' | 'moves';

export const App: React.FC = () => {
  // Mode: 'review' (Game Review with tabs) OR 'live_studio' (Dedicated Live Analysis Studio)
  const [viewMode, setViewMode] = useState<ViewMode>('review');

  // Review Report State
  const [report, setReport] = useState<GameReviewReport | null>(null);
  const [currentPly, setCurrentPly] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [isRetryMode, setIsRetryMode] = useState<boolean>(false);

  // Review Right Panel Tab: 'coach' | 'engine' | 'moves'
  const [reviewTab, setReviewTab] = useState<RightPanelTab>('coach');

  // Guided Key Moments Walkthrough state
  const [isKeyMomentsMode, setIsKeyMomentsMode] = useState<boolean>(false);
  const [keyMomentIndex, setKeyMomentIndex] = useState<number>(0);
  const [keyMomentSolved, setKeyMomentSolved] = useState<boolean>(false);

  // Dedicated Live Studio State (Transported from review or custom)
  const [studioFen, setStudioFen] = useState<string>(START_FEN);
  const [studioMoves, setStudioMoves] = useState<LiveMoveItem[]>([]);
  const [transportedPly, setTransportedPly] = useState<number | null>(null);
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

  // Determine game move FEN
  const gameFen = useMemo(() => {
    if (!report || !report.moves || report.moves.length === 0) return START_FEN;
    if (currentPly <= -1) return report.moves[0]?.fenBefore || START_FEN;
    const safePly = Math.min(report.moves.length - 1, Math.max(0, currentPly));
    return report.moves[safePly]?.fenAfter || START_FEN;
  }, [report, currentPly]);

  const activeFen = viewMode === 'live_studio' ? studioFen : gameFen;
  const isBotMovingRef = useRef<boolean>(false);

  // Start continuous streaming live analysis whenever studio mode is open or engine tab is selected
  useEffect(() => {
    const shouldRunLiveEngine =
      viewMode === 'live_studio' || (viewMode === 'review' && reviewTab === 'engine');

    if (shouldRunLiveEngine) {
      liveEngine.startAnalysis(activeFen, 18, (update) => {
        setLiveAnalysis(update);
      });
    } else {
      liveEngine.stop();
    }
  }, [activeFen, viewMode, reviewTab]);

  // Handle Play Against Engine in live studio mode
  useEffect(() => {
    if (
      viewMode === 'live_studio' &&
      isPlayEngineMode &&
      liveAnalysis &&
      !liveAnalysis.isSearching &&
      liveAnalysis.fen === studioFen &&
      liveAnalysis.bestMoveUci &&
      liveAnalysis.bestMoveUci.length >= 4 &&
      !isBotMovingRef.current
    ) {
      const turn = studioFen.split(' ')[1] as 'w' | 'b';
      const playerColor = orientation === 'white' ? 'w' : 'b';

      if (turn !== playerColor) {
        isBotMovingRef.current = true;
        const uciToPlay = liveAnalysis.bestMoveUci;

        const timer = setTimeout(() => {
          try {
            const chess = new Chess(studioFen);
            const from = uciToPlay.substring(0, 2) as Square;
            const to = uciToPlay.substring(2, 4) as Square;
            const promotion = uciToPlay.length > 4 ? uciToPlay[4] : undefined;

            const move = chess.move({ from, to, promotion });
            if (move) {
              const newFen = chess.fen();
              setStudioFen(newFen);
              setStudioMoves((prev) => [
                ...prev,
                {
                  ply: prev.length,
                  moveNumber: Math.floor(prev.length / 2) + 1,
                  turn: move.color,
                  san: move.san,
                  uci: uciToPlay,
                  from: move.from,
                  to: move.to,
                  piece: move.piece,
                  captured: move.captured,
                  promotion: move.promotion,
                  fenBefore: studioFen,
                  fenAfter: newFen,
                },
              ]);
            }
          } catch (err) {
            console.warn('Bot move failed safely:', err);
          } finally {
            isBotMovingRef.current = false;
          }
        }, 500);

        return () => {
          clearTimeout(timer);
          isBotMovingRef.current = false;
        };
      }
    }
  }, [viewMode, isPlayEngineMode, liveAnalysis, studioFen, orientation]);

  // Transport Current Position from Game Review into Live Studio
  const handleTransportToLiveStudio = useCallback(() => {
    setStudioFen(gameFen);
    setStudioMoves([]);
    setTransportedPly(currentPly);
    setViewMode('live_studio');
  }, [gameFen, currentPly]);

  const handleLoadAndAnalyzePgn = useCallback(
    async (pgn: string, forceReanalyze: boolean = false) => {
      setViewMode('review');
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
          setViewMode('review');
        }
      }
    } catch (err) {
      console.warn('Failed to load game from cache key:', err);
    }
  }, []);

  const handleStartKeyMoments = useCallback(() => {
    if (keyMoments.length === 0) return;
    setViewMode('review');
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
    setCurrentPly(-1);
  }, []);

  const handlePrevMove = useCallback(() => {
    setIsPlaying(false);
    setIsRetryMode(false);
    setIsKeyMomentsMode(false);
    setCurrentPly((prev) => Math.max(-1, prev - 1));
  }, []);

  const handleNextMove = useCallback(() => {
    setIsPlaying(false);
    setIsRetryMode(false);
    setIsKeyMomentsMode(false);
    if (report && report.moves) {
      setCurrentPly((prev) => Math.min(report.moves.length - 1, prev + 1));
    }
  }, [report]);

  const handleLastMove = useCallback(() => {
    setIsPlaying(false);
    setIsRetryMode(false);
    setIsKeyMomentsMode(false);
    if (report && report.moves) {
      setCurrentPly(report.moves.length - 1);
    }
  }, [report]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleSelectPly = useCallback((ply: number) => {
    setIsPlaying(false);
    setIsRetryMode(false);
    setIsKeyMomentsMode(false);
    setCurrentPly(ply);
  }, []);

  // Piece drop handler for both modes
  const handlePieceDropAction = useCallback(
    (source: Square, target: Square, promotion?: string): boolean => {
      try {
        const boardFen = viewMode === 'live_studio' ? studioFen : gameFen;
        const chess = new Chess(boardFen);
        const move = chess.move({
          from: source,
          to: target,
          promotion: promotion || undefined,
        });

        if (!move) return false;

        const nextFen = chess.fen();
        const playedUci = `${source}${target}${promotion || ''}`;

        if (viewMode === 'live_studio') {
          setStudioFen(nextFen);
          setStudioMoves((prev) => [
            ...prev,
            {
              ply: prev.length,
              moveNumber: Math.floor(prev.length / 2) + 1,
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
            },
          ]);
          return true;
        }

        // In Review Mode: If move matches next move in game, advance game move
        const nextGameMove = report && currentPly + 1 < report.moves.length ? report.moves[currentPly + 1] : null;
        if (nextGameMove && (nextGameMove.uci === playedUci || nextGameMove.san === move.san)) {
          setCurrentPly((prev) => prev + 1);
          return true;
        }

        // Otherwise: Promptly transport into Live Studio with this new move!
        setStudioFen(nextFen);
        setStudioMoves([
          {
            ply: 0,
            moveNumber: Math.floor(Math.max(0, currentPly) / 2) + 1,
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
          },
        ]);
        setTransportedPly(currentPly);
        setViewMode('live_studio');
        return true;
      } catch {
        return false;
      }
    },
    [viewMode, studioFen, gameFen, report, currentPly]
  );

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

      if (viewMode === 'review') {
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
        }
      }

      if (e.key.toLowerCase() === 'x') {
        setOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handlePrevMove, handleNextMove, handleFirstMove, handleLastMove, handleTogglePlay]);

  const currentMove =
    viewMode === 'review' && report && report.moves && currentPly >= 0 && currentPly < report.moves.length
      ? report.moves[currentPly]
      : null;

  const currentEval = (() => {
    if (viewMode === 'live_studio' && liveAnalysis?.evaluation) {
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

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-zinc-850 p-1 rounded-xl border border-zinc-700/80">
            <button
              onClick={() => setViewMode('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'review'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookOpen size={13} />
              <span>Game Review</span>
            </button>

            <button
              onClick={() => {
                if (viewMode !== 'live_studio') {
                  handleTransportToLiveStudio();
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'live_studio'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity size={13} className={viewMode === 'live_studio' ? 'animate-pulse' : ''} />
              <span>Live Studio</span>
            </button>
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
          {/* Header Bar */}
          {viewMode === 'review' ? (
            <GameReviewHeader
              report={report}
              onOpenSummary={() => setIsSummaryModalOpen(true)}
              onOpenImport={() => setIsImportModalOpen(true)}
              onStartKeyMoments={handleStartKeyMoments}
              isKeyMomentsActive={isKeyMomentsMode}
            />
          ) : (
            /* Live Studio Transport Header */
            <div className="w-full bg-[#1e1d1a] border border-emerald-500/50 rounded-xl p-3 shadow-md flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Activity size={18} className="animate-spin" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span>Live Analysis Studio</span>
                    {transportedPly !== null && (
                      <span className="text-xs px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                        Transported from Move {transportedPly >= 0 ? Math.floor(transportedPly / 2) + 1 : 'Start'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Live streaming Stockfish depth {liveAnalysis?.depth || 0}/18 • Drag pieces to explore alternative lines on the fly.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {report && (
                  <button
                    onClick={() => setViewMode('review')}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors shadow"
                  >
                    ⬅️ Return to Game Review
                  </button>
                )}
                <button
                  onClick={() => {
                    setStudioFen(START_FEN);
                    setStudioMoves([]);
                    setTransportedPly(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
                >
                  New Clean Board
                </button>
              </div>
            </div>
          )}

          {/* Guided Key Moments Walkthrough Bar if Active in Review Mode */}
          {viewMode === 'review' && isKeyMomentsMode && keyMoments.length > 0 && (
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
            {/* Left Column: Eval Bar + Chessboard (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                {/* Vertical Evaluation Bar */}
                <EvaluationBar
                  evaluation={currentEval}
                  orientation={orientation}
                  height="h-[320px] sm:h-[480px] md:h-[520px]"
                />

                {/* Chessboard Area */}
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
                  isLiveMode={viewMode === 'live_studio'}
                  liveCandidateArrows={liveCandidateArrows}
                  onPieceDropAction={handlePieceDropAction}
                />
              </div>

              {/* Playback & Navigation Controls */}
              {viewMode === 'review' ? (
                <div className="flex items-center justify-between w-full max-w-[540px] bg-[#1e1d1a] border border-zinc-800 p-2 rounded-xl shadow-md">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={handleFirstMove}
                      disabled={currentPly <= -1}
                      className="p-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 transition-colors"
                      title="First Move (Up Arrow)"
                    >
                      <ChevronsLeft size={18} />
                    </button>

                    <button
                      onClick={handlePrevMove}
                      disabled={currentPly <= -1}
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

                  {/* Transport to Live Studio Button */}
                  <button
                    onClick={handleTransportToLiveStudio}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/40 transition-all shadow hover:scale-105"
                    title="Transport this board position to Live Analysis Studio"
                  >
                    <ExternalLink size={13} className="text-emerald-400" />
                    <span>Transport to Live Board</span>
                  </button>
                </div>
              ) : (
                /* Live Studio Controls Bar */
                <div className="flex items-center justify-between w-full max-w-[540px] bg-[#1e1d1a] border border-zinc-800 p-2 rounded-xl shadow-md text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">
                      Moves in Sandbox: {studioMoves.length}
                    </span>
                    {studioMoves.length > 0 && (
                      <span className="font-mono text-emerald-400">
                        ({studioMoves.map((m) => m.san).slice(-4).join(' ')})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {transportedPly !== null && (
                      <button
                        onClick={() => {
                          setStudioFen(gameFen);
                          setStudioMoves([]);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
                        title="Reset sandbox to the original game position"
                      >
                        Reset to Game Move
                      </button>
                    )}
                    <button
                      onClick={() => setViewMode('review')}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
                    >
                      Done / Return
                    </button>
                  </div>
                </div>
              )}

              {/* Evaluation Advantage Graph (Review Mode) */}
              {viewMode === 'review' && report && report.moves && report.moves.length > 0 && (
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

            {/* Right Column: Review Tabs OR Live Analysis Panel (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-2 h-full">
              {viewMode === 'live_studio' ? (
                /* Live Studio Panel */
                <div className="min-h-[500px]">
                  <LiveAnalysisPanel
                    analysis={liveAnalysis}
                    currentFen={studioFen}
                    onPreviewLine={handlePreviewLiveLine}
                    persona={persona}
                    onResetToStart={() => {
                      setStudioFen(START_FEN);
                      setStudioMoves([]);
                      setTransportedPly(null);
                    }}
                    isPlayEngineMode={isPlayEngineMode}
                    onTogglePlayEngine={() => setIsPlayEngineMode((prev) => !prev)}
                  />
                </div>
              ) : (
                /* Game Review Workspace Tabs */
                <>
                  <div className="flex items-center gap-1 bg-[#1e1d1a] border border-zinc-800 p-1 rounded-xl shadow">
                    <button
                      onClick={() => setReviewTab('coach')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        reviewTab === 'coach'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Bot size={14} />
                      <span>AI Coach</span>
                    </button>

                    <button
                      onClick={() => setReviewTab('engine')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        reviewTab === 'engine'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Activity size={14} className={liveAnalysis?.isSearching ? 'animate-spin' : ''} />
                      <span>Live Lines</span>
                    </button>

                    <button
                      onClick={() => setReviewTab('moves')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        reviewTab === 'moves'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <ListOrdered size={14} />
                      <span>Moves {report ? `(${report.moves.length})` : ''}</span>
                    </button>
                  </div>

                  {/* Active Review Tab Content */}
                  <div className="min-h-[460px] sm:min-h-[520px]">
                    {reviewTab === 'coach' && (
                      <CoachPanel
                        currentMove={currentMove}
                        currentFen={activeFen}
                        persona={persona}
                        onRetryMove={() => setIsRetryMode(true)}
                      />
                    )}

                    {reviewTab === 'engine' && (
                      <LiveAnalysisPanel
                        analysis={liveAnalysis}
                        currentFen={activeFen}
                        onPreviewLine={handlePreviewLiveLine}
                        persona={persona}
                        onResetToStart={handleTransportToLiveStudio}
                        isPlayEngineMode={isPlayEngineMode}
                        onTogglePlayEngine={() => setIsPlayEngineMode((prev) => !prev)}
                      />
                    )}

                    {reviewTab === 'moves' && (
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
                </>
              )}
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
