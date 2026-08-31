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

interface WorkerInstance {
  id: number;
  worker: Worker;
  isReady: boolean;
  busy: boolean;
  currentResolver: ((result: PositionEvaluationResult) => void) | null;
  currentFen: string;
  currentTurn: 'w' | 'b';
  targetDepth: number;
  currentLines: Map<number, EngineLine>;
  bestMoveFound: string;
}

export class StockfishWorkerPool {
  private workers: WorkerInstance[] = [];
  private poolSize: number = 4;
  private initPromise: Promise<void>;

  constructor() {
    // Determine pool size from CPU cores (clamp between 2 and 6)
    const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
    this.poolSize = Math.max(2, Math.min(6, cores));
    this.initPromise = this.initPool();
  }

  private async initPool(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < this.poolSize; i++) {
      promises.push(this.createWorkerInstance(i));
    }

    await Promise.all(promises);
  }

  private createWorkerInstance(id: number): Promise<void> {
    return new Promise((resolve) => {
      try {
        const worker = new Worker('/stockfish/stockfish-18-asm.js');
        const instance: WorkerInstance = {
          id,
          worker,
          isReady: false,
          busy: false,
          currentResolver: null,
          currentFen: '',
          currentTurn: 'w',
          targetDepth: 12,
          currentLines: new Map(),
          bestMoveFound: '',
        };

        worker.onmessage = (e: MessageEvent) => {
          const data = typeof e.data === 'string' ? e.data : '';
          this.handleWorkerMessage(instance, data);
          if (data.includes('readyok') || data.includes('uciok')) {
            instance.isReady = true;
            resolve();
          }
        };

        worker.onerror = (err) => {
          console.error(`Stockfish Worker #${id} error:`, err);
          instance.isReady = true;
          resolve();
        };

        worker.postMessage('uci');
        worker.postMessage('isready');
        worker.postMessage('setoption name MultiPV value 2');

        this.workers.push(instance);

        setTimeout(() => {
          instance.isReady = true;
          resolve();
        }, 1000);
      } catch (err) {
        console.error(`Failed to initialize worker #${id}:`, err);
        resolve();
      }
    });
  }

  private handleWorkerMessage(inst: WorkerInstance, line: string) {
    if (!line) return;

    if (line.startsWith('info ') && line.includes(' score ') && line.includes(' pv ')) {
      const depthMatch = line.match(/\bdepth (\d+)/);
      const depth = depthMatch ? parseInt(depthMatch[1], 10) : inst.targetDepth;

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

      const isWhiteToMove = inst.currentTurn === 'w';
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

      const existing = inst.currentLines.get(multipv);
      if (!existing || depth >= existing.eval.depth) {
        inst.currentLines.set(multipv, engineLine);
      }
    }

    if (line.startsWith('bestmove ')) {
      const parts = line.split(/\s+/);
      inst.bestMoveFound = parts[1] || '';
      this.finishWorkerEvaluation(inst);
    }
  }

  private finishWorkerEvaluation(inst: WorkerInstance) {
    if (!inst.currentResolver) return;

    const line1 = inst.currentLines.get(1);
    const line2 = inst.currentLines.get(2);

    let bestMove = inst.bestMoveFound;
    if (!bestMove || bestMove === '(none)') {
      bestMove = line1?.uci || '';
    }

    const bestLine = line1?.pv || (bestMove ? [bestMove] : []);
    const evalData = line1?.eval || {
      type: 'cp',
      value: 0,
      whiteValue: 0,
      depth: inst.targetDepth,
    };

    const altLines: EngineLine[] = [];
    if (line2) altLines.push(line2);

    const result: PositionEvaluationResult = {
      fen: inst.currentFen,
      depth: evalData.depth,
      bestMove,
      bestLine,
      eval: evalData,
      alternativeLines: altLines,
    };

    const resolve = inst.currentResolver;
    inst.currentResolver = null;
    inst.busy = false;
    resolve(result);
  }

  public async evaluatePosition(fen: string, depth: number = 12): Promise<PositionEvaluationResult> {
    await this.initPromise;

    // Find available worker
    let worker = this.workers.find((w) => !w.busy);
    if (!worker) {
      // If all busy, pick the first one
      worker = this.workers[0];
    }

    return new Promise((resolve) => {
      worker!.busy = true;
      worker!.currentResolver = resolve;
      worker!.currentFen = fen;
      worker!.currentTurn = fen.split(' ')[1] === 'b' ? 'b' : 'w';
      worker!.targetDepth = depth;
      worker!.currentLines.clear();
      worker!.bestMoveFound = '';

      worker!.worker.postMessage('stop');
      worker!.worker.postMessage(`position fen ${fen}`);
      worker!.worker.postMessage(`go depth ${depth}`);

      setTimeout(() => {
        if (worker!.currentResolver === resolve) {
          worker!.worker.postMessage('stop');
          setTimeout(() => {
            if (worker!.currentResolver === resolve) {
              this.finishWorkerEvaluation(worker!);
            }
          }, 100);
        }
      }, 6000);
    });
  }

  /**
   * Evaluates an array of board FENs in parallel across the worker pool.
   */
  public async evaluateBatchParallel(
    fens: string[],
    depth: number = 12,
    onPositionDone?: (completedCount: number, totalCount: number) => void
  ): Promise<PositionEvaluationResult[]> {
    await this.initPromise;

    const total = fens.length;
    const results: PositionEvaluationResult[] = new Array(total);
    let nextIndex = 0;
    let completed = 0;

    const runWorkerLoop = async (inst: WorkerInstance) => {
      while (nextIndex < total) {
        const idx = nextIndex++;
        const fen = fens[idx];

        const res = await new Promise<PositionEvaluationResult>((resolve) => {
          inst.busy = true;
          inst.currentResolver = resolve;
          inst.currentFen = fen;
          inst.currentTurn = fen.split(' ')[1] === 'b' ? 'b' : 'w';
          inst.targetDepth = depth;
          inst.currentLines.clear();
          inst.bestMoveFound = '';

          inst.worker.postMessage(`position fen ${fen}`);
          inst.worker.postMessage(`go depth ${depth}`);

          setTimeout(() => {
            if (inst.currentResolver === resolve) {
              inst.worker.postMessage('stop');
              setTimeout(() => {
                if (inst.currentResolver === resolve) {
                  this.finishWorkerEvaluation(inst);
                }
              }, 100);
            }
          }, 6000);
        });

        results[idx] = res;
        completed++;
        if (onPositionDone) {
          onPositionDone(completed, total);
        }
      }
    };

    // Run all worker loops concurrently
    await Promise.all(this.workers.map((w) => runWorkerLoop(w)));

    return results;
  }

  public terminate() {
    for (const w of this.workers) {
      w.worker.terminate();
    }
    this.workers = [];
  }
}

export const stockfishPool = new StockfishWorkerPool();
