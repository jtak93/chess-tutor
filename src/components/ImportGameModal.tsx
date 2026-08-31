import React, { useState } from 'react';
import { SAMPLE_GAMES } from '../data/sampleGames';
import type { SampleGame } from '../data/sampleGames';
import { fetchChessComGames, fetchLichessGames } from '../services/gameFetcher';
import type { FetchedGameInfo } from '../services/gameFetcher';
import { getCachedGamesIndex } from '../services/gameCache';
import type { CachedGameMeta } from '../services/gameCache';
import {
  X,
  FileText,
  Globe,
  Bookmark,
  Upload,
  Loader2,
  AlertCircle,
  Database,
  Calendar,
  Zap,
} from 'lucide-react';

interface ImportGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPgn: (pgn: string) => void;
  onLoadCachedGame?: (cacheKey: string) => void;
}

type TabType = 'cached' | 'samples' | 'pgn' | 'chesscom' | 'lichess';

export const ImportGameModal: React.FC<ImportGameModalProps> = ({
  isOpen,
  onClose,
  onLoadPgn,
  onLoadCachedGame,
}) => {
  const cachedGames = getCachedGamesIndex();
  const [activeTab, setActiveTab] = useState<TabType>(cachedGames.length > 0 ? 'cached' : 'samples');
  const [pgnInput, setPgnInput] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [fetchedGames, setFetchedGames] = useState<FetchedGameInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectSample = (sample: SampleGame) => {
    onLoadPgn(sample.pgn);
    onClose();
  };

  const handlePgnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgnInput.trim()) {
      setErrorMessage('Please paste a valid PGN game.');
      return;
    }
    onLoadPgn(pgnInput.trim());
    onClose();
  };

  const handleSelectCached = (meta: CachedGameMeta) => {
    if (onLoadCachedGame) {
      onLoadCachedGame(meta.cacheKey);
      onClose();
    } else {
      const reportJson = localStorage.getItem(meta.cacheKey);
      if (reportJson) {
        try {
          const report = JSON.parse(reportJson);
          if (report.metadata?.pgn) {
            onLoadPgn(report.metadata.pgn);
          }
        } catch {
          // ignore
        }
      }
      onClose();
    }
  };

  const handleFetchOnlineGames = async (platform: 'chesscom' | 'lichess') => {
    if (!usernameInput.trim()) {
      setErrorMessage(`Please enter a ${platform === 'chesscom' ? 'Chess.com' : 'Lichess'} username.`);
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setFetchedGames([]);

    try {
      let games: FetchedGameInfo[] = [];
      if (platform === 'chesscom') {
        games = await fetchChessComGames(usernameInput.trim());
      } else {
        games = await fetchLichessGames(usernameInput.trim());
      }
      setFetchedGames(games);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch games.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOnlineGame = (game: FetchedGameInfo) => {
    if (game.pgn) {
      onLoadPgn(game.pgn);
      onClose();
    } else {
      setErrorMessage('No PGN moves available for this game.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1e1d1a] border border-zinc-700 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Upload size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Load or Import Game</h2>
              <div className="text-xs text-zinc-400">Choose a game to review with the AI Chess Tutor</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-5 p-2 bg-zinc-900 border-b border-zinc-800 text-xs font-medium gap-1">
          {/* Tab: Cached */}
          <button
            onClick={() => {
              setActiveTab('cached');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'cached'
                ? 'bg-zinc-800 text-emerald-400 shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database size={12} />
            <span>Cached ({cachedGames.length})</span>
          </button>

          {/* Tab: Samples */}
          <button
            onClick={() => {
              setActiveTab('samples');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'samples'
                ? 'bg-zinc-800 text-emerald-400 shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark size={12} />
            <span>Featured</span>
          </button>

          {/* Tab: PGN */}
          <button
            onClick={() => {
              setActiveTab('pgn');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'pgn'
                ? 'bg-zinc-800 text-emerald-400 shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText size={12} />
            <span>Paste PGN</span>
          </button>

          {/* Tab: Chess.com */}
          <button
            onClick={() => {
              setActiveTab('chesscom');
              setErrorMessage('');
              setFetchedGames([]);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'chesscom'
                ? 'bg-zinc-800 text-emerald-400 shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe size={12} />
            <span>Chess.com</span>
          </button>

          {/* Tab: Lichess */}
          <button
            onClick={() => {
              setActiveTab('lichess');
              setErrorMessage('');
              setFetchedGames([]);
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'lichess'
                ? 'bg-zinc-800 text-emerald-400 shadow font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe size={12} />
            <span>Lichess</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* TAB 0: Cached Games */}
          {activeTab === 'cached' && (
            <div className="space-y-2.5">
              {cachedGames.length > 0 ? (
                cachedGames.map((game) => (
                  <button
                    key={game.cacheKey}
                    onClick={() => handleSelectCached(game)}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/80 hover:bg-zinc-800/80 text-left transition-all group flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-zinc-100 text-xs flex items-center gap-2">
                        <span>{game.white} vs {game.black}</span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-0.5">
                          <Zap size={10} /> Instant
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {game.date || new Date(game.cachedAt).toLocaleDateString()}
                        </span>
                        <span>{game.movesCount} plies</span>
                        <span className="font-mono">Result: {game.result}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div className="text-[11px] font-mono">
                        <div className="text-emerald-400 font-semibold">{game.whiteAccuracy}% W</div>
                        <div className="text-zinc-300 font-semibold">{game.blackAccuracy}% B</div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-zinc-500 text-xs space-y-2">
                  <Database size={32} className="mx-auto text-zinc-600" />
                  <div>No games cached yet.</div>
                  <div className="text-[11px] text-zinc-600">
                    When you analyze any game, it is automatically cached in your browser for 0ms reopening!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: Sample Master Games */}
          {activeTab === 'samples' && (
            <div className="space-y-2.5">
              {SAMPLE_GAMES.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectSample(game)}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/80 hover:bg-zinc-800/80 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-zinc-100 text-xs group-hover:text-emerald-400 transition-colors">
                      {game.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {game.eco}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-normal">{game.description}</div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 2: Paste PGN */}
          {activeTab === 'pgn' && (
            <form onSubmit={handlePgnSubmit} className="space-y-3">
              <textarea
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                placeholder="Paste PGN here, for example:&#10;1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
                rows={8}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all hover:scale-[1.01]"
              >
                Analyze PGN
              </button>
            </form>
          )}

          {/* TAB 3: Chess.com Username Fetch */}
          {activeTab === 'chesscom' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter Chess.com username (e.g. hikaru, magnuscarlsen)..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchOnlineGames('chesscom')}
                />
                <button
                  type="button"
                  onClick={() => handleFetchOnlineGames('chesscom')}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Fetch'}
                </button>
              </div>

              {fetchedGames.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800 max-h-60 overflow-y-auto">
                  {fetchedGames.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleSelectOnlineGame(g)}
                      className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left text-xs text-zinc-300 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-zinc-100">
                          {g.white} vs {g.black}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {g.timeControl} • {g.date}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-zinc-400">{g.result}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Lichess Username Fetch */}
          {activeTab === 'lichess' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter Lichess username (e.g. DrNykterstein, penguingm1)..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchOnlineGames('lichess')}
                />
                <button
                  type="button"
                  onClick={() => handleFetchOnlineGames('lichess')}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : 'Fetch'}
                </button>
              </div>

              {fetchedGames.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800 max-h-60 overflow-y-auto">
                  {fetchedGames.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => handleSelectOnlineGame(g)}
                      className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left text-xs text-zinc-300 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-zinc-100">
                          {g.white} vs {g.black}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {g.timeControl} • {g.date}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-zinc-400">{g.result}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
