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
    // Ignore invalid sequences
  }
  return result;
}

export class LiveEngineService {
  private worker: Worker | null = null;
  public isReady: boolean = false;
  private isSearching: boolean = false;
  private currentFen: string = '';
  private currentTurn: 'w' | 'b' = 'w';
  private maxDepth: number = 18;
  private updateCallback: ((update: LiveAnalysisUpdate) => void) | null = null;

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
      this.worker = new Worker('/stockfish/stockfish-18-asm.js');

      this.worker.onmessage = (e: MessageEvent) => {
        const data = typeof e.data === 'string' ? e.data : '';
        this.handleMessage(data);
      };

      this.worker.onerror = (err) => {
        console.error('Live Engine worker error:', err);
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
      this.emitUpdate();
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

  /**
   * Starts streaming live analysis for a specific position FEN.
   */
  public startAnalysis(
    fen: string,
    depth: number = 18,
    onUpdate: (update: LiveAnalysisUpdate) => void
  ) {
    this.stop();

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

    if (!this.worker) {
      this.initWorker();
    }

    this.worker?.postMessage(`position fen ${fen}`);
    this.worker?.postMessage(`go depth ${depth}`);
  }

  /**
   * Stops active engine search immediately.
   */
  public stop() {
    if (this.isSearching) {
      this.worker?.postMessage('stop');
      this.isSearching = false;
    }
  }

  public terminate() {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
  }
}

export const liveEngine = new LiveEngineService();
