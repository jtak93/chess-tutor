import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { EngineEval, LiveAnalysisUpdate, LiveEngineLine } from '../types/chess';

export function uciToSanSequence(fen: string, uciMoves: string[]): string[] {
  const result: string[] = [];
  try {
    const chess = new Chess(fen);
    for (const uci of uciMoves) {
      if (!uci || uci.length < 4 || uci === '(none)') break;
      const from = uci.substring(0, 2) as Square;
      const to = uci.substring(2, 4) as Square;
      const promotion = uci.length > 4 ? uci[4] : undefined;

      const move = chess.move({
        from,
        to,
        promotion,
      });
      if (move) {
        result.push(move.san);
      } else {
        break;
      }
    }
  } catch {
    // Ignore invalid sequences safely
  }
  return result;
}

export class LiveEngineService {
  private worker: Worker | null = null;
  public isReady: boolean = false;
  private isSearching: boolean = false;
  private isWorkerBusy: boolean = false;

  private currentFen: string = '';
  private currentTurn: 'w' | 'b' = 'w';
  private maxDepth: number = 18;
  private updateCallback: ((update: LiveAnalysisUpdate) => void) | null = null;

  // Search generation token to discard stale messages from prior positions
  private currentSearchId: number = 0;
  private activeSearchId: number = 0;

  // Debounce & command queue
  private debounceTimer: any = null;
  private pendingSearch: { fen: string; depth: number; searchId: number } | null = null;

  // Active MultiPV map
  private linesMap = new Map<number, LiveEngineLine>();
  private currentDepth: number = 0;
  private nodes: number = 0;
  private nps: number = 0;
  private bestMoveUci: string = '';

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      if (this.worker) {
        try {
          this.worker.terminate();
        } catch {
          // ignore
        }
        this.worker = null;
      }

      const workerUrl = ((import.meta as any).env?.BASE_URL || '/') + 'stockfish/stockfish-18-asm.js';
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e: MessageEvent) => {
        const data = typeof e.data === 'string' ? e.data : '';
        this.handleMessage(data);
      };

      this.worker.onerror = (err) => {
        console.error('Live Engine worker error. Recovering worker instance...', err);
        this.isWorkerBusy = false;
        this.isSearching = false;
        this.isReady = false;
        setTimeout(() => this.initWorker(), 200);
      };

      this.worker.postMessage('uci');
      this.worker.postMessage('isready');
      this.worker.postMessage('setoption name MultiPV value 3');
      this.worker.postMessage('setoption name Hash value 32');
    } catch (err) {
      console.error('Failed to instantiate Live Engine worker:', err);
    }
  }

  private handleMessage(line: string) {
    if (!line) return;

    if (line === 'readyok' || line.includes('uciok')) {
      this.isReady = true;
      this.isWorkerBusy = false;
      if (this.pendingSearch) {
        const next = this.pendingSearch;
        this.pendingSearch = null;
        this.dispatchSearch(next.fen, next.depth, next.searchId);
      }
      return;
    }

    // Discard any UCI evaluation message that belongs to an older search generation
    if (this.activeSearchId !== this.currentSearchId) {
      if (line.startsWith('bestmove ')) {
        this.isWorkerBusy = false;
        if (this.pendingSearch) {
          const next = this.pendingSearch;
          this.pendingSearch = null;
          this.dispatchSearch(next.fen, next.depth, next.searchId);
        }
      }
      return;
    }

    if (line.startsWith('info ') && line.includes(' score ') && line.includes(' pv ')) {
      const depthMatch = line.match(/\bdepth (\d+)/);
      const depth = depthMatch ? parseInt(depthMatch[1], 10) : this.currentDepth;

      const multipvMatch = line.match(/\bmultipv (\d+)/);
      const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;

      const nodesMatch = line.match(/\bnodes (\d+)/);
      if (nodesMatch) this.nodes = parseInt(nodesMatch[1], 10);

      const npsMatch = line.match(/\bnps (\d+)/);
      if (npsMatch) this.nps = parseInt(npsMatch[1], 10);

      let evalType: 'cp' | 'mate' = 'cp';
      let rawScore = 0;

      const cpMatch = line.match(/\bscore cp (-?\d+)/);
      const mateMatch = line.match(/\bscore mate (-?\d+)/);

      if (mateMatch) {
        evalType = 'mate';
        rawScore = parseInt(mateMatch[1], 10);
      } else if (cpMatch) {
        evalType = 'cp';
        rawScore = parseInt(cpMatch[1], 10);
      }

      const isWhiteToMove = this.currentTurn === 'w';
      const whiteValue = isWhiteToMove ? rawScore : -rawScore;

      const pvIndex = line.indexOf(' pv ');
      const pvMoves = pvIndex !== -1 ? line.substring(pvIndex + 4).trim().split(/\s+/) : [];
      const moveUci = pvMoves[0] || '';

      const pvSan = uciToSanSequence(this.currentFen, pvMoves);
      const moveSan = pvSan[0] || moveUci;

      const engineEval: EngineEval = {
        type: evalType,
        value: rawScore,
        whiteValue,
        depth,
      };

      const engineLine: LiveEngineLine = {
        rank: multipv,
        uci: moveUci,
        san: moveSan,
        eval: engineEval,
        pvSan,
      };

      this.linesMap.set(multipv, engineLine);
      this.currentDepth = Math.max(this.currentDepth, depth);

      this.emitUpdate();
    }

    if (line.startsWith('bestmove ')) {
      const parts = line.split(/\s+/);
      this.bestMoveUci = parts[1] || '';
      this.isSearching = false;
      this.isWorkerBusy = false;
      this.emitUpdate();

      if (this.pendingSearch) {
        const next = this.pendingSearch;
        this.pendingSearch = null;
        this.dispatchSearch(next.fen, next.depth, next.searchId);
      }
    }
  }

  private emitUpdate() {
    if (!this.updateCallback) return;

    const topLines: LiveEngineLine[] = [];
    for (let i = 1; i <= 3; i++) {
      const l = this.linesMap.get(i);
      if (l) topLines.push(l);
    }

    const primaryLine = topLines[0];
    const bestMoveUci = this.bestMoveUci || primaryLine?.uci || '';
    const bestMoveSan = primaryLine?.san || '';
    const evaluation = primaryLine?.eval || {
      type: 'cp',
      value: 0,
      whiteValue: 0,
      depth: this.currentDepth,
    };

    const update: LiveAnalysisUpdate = {
      fen: this.currentFen,
      depth: this.currentDepth,
      maxDepth: this.maxDepth,
      nodes: this.nodes,
      nps: this.nps,
      topLines,
      bestMoveUci,
      bestMoveSan,
      evaluation,
      isSearching: this.isSearching,
    };

    this.updateCallback(update);
  }

  private dispatchSearch(fen: string, depth: number, searchId: number) {
    if (searchId !== this.currentSearchId) return;

    if (!this.worker) {
      this.initWorker();
    }

    this.activeSearchId = searchId;
    this.isWorkerBusy = true;
    this.isSearching = true;

    try {
      this.worker?.postMessage(`position fen ${fen}`);
      this.worker?.postMessage(`go depth ${depth}`);
    } catch (err) {
      console.error('Error posting message to live engine worker:', err);
      this.isWorkerBusy = false;
      this.initWorker();
    }
  }

  /**
   * Starts streaming live analysis for a specific position FEN with debouncing and generation tracking.
   */
  public startAnalysis(
    fen: string,
    depth: number = 18,
    onUpdate: (update: LiveAnalysisUpdate) => void
  ) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    const searchId = ++this.currentSearchId;

    this.currentFen = fen;
    this.currentTurn = fen.split(' ')[1] === 'b' ? 'b' : 'w';
    this.maxDepth = depth;
    this.updateCallback = onUpdate;
    this.linesMap.clear();
    this.currentDepth = 0;
    this.nodes = 0;
    this.nps = 0;
    this.bestMoveUci = '';
    this.isSearching = true;

    // Emit initial loading state immediately so UI updates and clears stale best moves
    this.emitUpdate();

    // Debounce actual worker execution by 80ms to smooth out rapid arrow key / drag movements
    this.debounceTimer = setTimeout(() => {
      if (searchId !== this.currentSearchId) return;

      if (this.isWorkerBusy) {
        // Signal worker to stop current calculation before sending new position
        this.pendingSearch = { fen, depth, searchId };
        try {
          this.worker?.postMessage('stop');
        } catch {
          this.initWorker();
        }
      } else {
        this.dispatchSearch(fen, depth, searchId);
      }
    }, 80);
  }

  /**
   * Stops active engine search immediately and cancels any pending search.
   */
  public stop() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingSearch = null;
    this.currentSearchId++;
    this.isSearching = false;

    if (this.isWorkerBusy) {
      try {
        this.worker?.postMessage('stop');
      } catch {
        // ignore
      }
    }
  }

  public terminate() {
    this.stop();
    try {
      this.worker?.terminate();
    } catch {
      // ignore
    }
    this.worker = null;
    this.isReady = false;
    this.isWorkerBusy = false;
  }
}

export const liveEngine = new LiveEngineService();
