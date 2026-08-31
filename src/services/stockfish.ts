import type { EngineEval, EngineLine } from '../types/chess';

export interface PositionEvaluationResult {
  fen: string;
  depth: number;
  bestMove: string;
  bestMoveSan?: string;
  bestLine: string[];
  eval: EngineEval;
  alternativeLines: EngineLine[];
}

export class StockfishService {
  private worker: Worker | null = null;
  private currentResolver: ((result: PositionEvaluationResult) => void) | null = null;
  private currentFen: string = '';
  private currentTurn: 'w' | 'b' = 'w';
  private targetDepth: number = 13;
  private currentLines: Map<number, EngineLine> = new Map();
  private bestMoveFound: string = '';
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initWorker();
  }

  private async initWorker(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.worker = new Worker('/stockfish/stockfish-18-asm.js');

        this.worker.onmessage = (e: MessageEvent) => {
          const data = typeof e.data === 'string' ? e.data : '';
          this.handleEngineMessage(data);
          if (data.includes('readyok') || data.includes('uciok')) {
            resolve();
          }
        };

        this.worker.onerror = (err) => {
          console.error('Stockfish Worker Error:', err);
          resolve();
        };

        this.sendCommand('uci');
        this.sendCommand('isready');
        this.sendCommand('setoption name MultiPV value 2');

        setTimeout(() => {
          resolve();
        }, 800);
      } catch (err) {
        console.error('Stockfish init worker error:', err);
        resolve();
      }
    });
  }

  public sendCommand(cmd: string) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    }
  }

  private handleEngineMessage(line: string) {
    if (!line) return;

    if (line.startsWith('info ') && line.includes(' score ') && line.includes(' pv ')) {
      this.parseInfoLine(line);
    }

    if (line.startsWith('bestmove ')) {
      const parts = line.split(/\s+/);
      this.bestMoveFound = parts[1] || '';
      this.finishCurrentEvaluation();
    }
  }

  private parseInfoLine(line: string) {
    const depthMatch = line.match(/\bdepth (\d+)/);
    const depth = depthMatch ? parseInt(depthMatch[1], 10) : this.targetDepth;

    const multipvMatch = line.match(/\bmultipv (\d+)/);
    const multipv = multipvMatch ? parseInt(multipvMatch[1], 10) : 1;

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

    const engineEval: EngineEval = {
      type: evalType,
      value: rawScore,
      whiteValue,
      depth,
    };

    const engineLine: EngineLine = {
      uci: moveUci,
      eval: engineEval,
      pv: pvMoves,
    };

    const existing = this.currentLines.get(multipv);
    if (!existing || depth >= existing.eval.depth) {
      this.currentLines.set(multipv, engineLine);
    }
  }

  private finishCurrentEvaluation() {
    if (!this.currentResolver) return;

    const line1 = this.currentLines.get(1);
    const line2 = this.currentLines.get(2);

    let bestMove = this.bestMoveFound;
    if (!bestMove || bestMove === '(none)') {
      bestMove = line1?.uci || '';
    }

    const bestLine = line1?.pv || (bestMove ? [bestMove] : []);
    const evalData = line1?.eval || {
      type: 'cp',
      value: 0,
      whiteValue: 0,
      depth: this.targetDepth,
    };

    const altLines: EngineLine[] = [];
    if (line2) altLines.push(line2);

    const result: PositionEvaluationResult = {
      fen: this.currentFen,
      depth: evalData.depth,
      bestMove,
      bestLine,
      eval: evalData,
      alternativeLines: altLines,
    };

    const resolve = this.currentResolver;
    this.currentResolver = null;
    resolve(result);
  }

  public async evaluatePosition(fen: string, depth: number = 13): Promise<PositionEvaluationResult> {
    await this.initPromise;

    return new Promise((resolve) => {
      this.currentResolver = resolve;
      this.currentFen = fen;
      this.currentTurn = fen.split(' ')[1] === 'b' ? 'b' : 'w';
      this.targetDepth = depth;
      this.currentLines.clear();
      this.bestMoveFound = '';

      this.sendCommand('stop');
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go depth ${depth}`);

      setTimeout(() => {
        if (this.currentResolver === resolve) {
          this.sendCommand('stop');
          setTimeout(() => {
            if (this.currentResolver === resolve) {
              this.finishCurrentEvaluation();
            }
          }, 100);
        }
      }, 7000);
    });
  }

  public terminate() {
    if (this.worker) {
      this.sendCommand('quit');
      this.worker.terminate();
      this.worker = null;
    }
  }
}

export const stockfishService = new StockfishService();
