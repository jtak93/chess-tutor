import { GoogleGenAI } from '@google/genai';
import type { CoachPersona, MoveAnalysis } from '../types/chess';
import { analyzeTactics } from './tacticalReasoner';

const API_KEY_STORAGE_KEY = 'chess_tutor_gemini_api_key';
const PERSONA_STORAGE_KEY = 'chess_tutor_coach_persona';

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
}

export function setStoredApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function getStoredPersona(): CoachPersona {
  return (localStorage.getItem(PERSONA_STORAGE_KEY) as CoachPersona) || 'grandmaster';
}

export function setStoredPersona(persona: CoachPersona): void {
  localStorage.setItem(PERSONA_STORAGE_KEY, persona);
}

const PERSONA_PROMPTS: Record<CoachPersona, string> = {
  grandmaster:
    'You are a World-Class Grandmaster Chess Coach. You provide sharp, concrete, and deeply insightful chess analysis. You highlight piece coordination, pawn structure weaknesses, tactical motifs (pins, forks, skewers, deflection, king safety), and concrete lines.',
  strict:
    'You are Grandmaster Boris, a strict, no-nonsense Russian Chess Master. You are blunt, demanding, and direct. You point out tactical carelessness, criticize lazy pawn moves, and demand sharp calculation.',
  friendly:
    'You are Coach Emma, an encouraging, friendly chess mentor. You explain chess strategy with clear, memorable analogies, explain why blunders happen without discouraging the player, and celebrate good tactical ideas.',
  witty:
    'You are Coach Blitz, a witty, energetic chess streamer. You use chess humor, dynamic commentary, and lively analogies while delivering master-level tactical insights.',
};

/**
 * Generates an intelligent, local, persona-flavored chess response without needing an API key.
 */
function generateLocalCoachAnswer(
  question: string,
  currentMove: MoveAnalysis | null,
  currentFen: string,
  persona: CoachPersona
): string {
  const qLower = question.toLowerCase();
  const player = currentMove?.turn === 'w' ? 'White' : 'Black';
  const opponent = currentMove?.turn === 'w' ? 'Black' : 'White';
  const san = currentMove?.san || '';
  const bestSan = currentMove?.bestMoveSan || currentMove?.bestMove || '';
  const classification = currentMove?.classification || 'good';

  let personaPrefix = '';
  if (persona === 'strict') personaPrefix = 'Look closely. ';
  else if (persona === 'friendly') personaPrefix = 'Great question! ';
  else if (persona === 'witty') personaPrefix = 'Boom! Here is the truth: ';

  // 1. Question about why a move was a mistake / blunder / inaccuracy
  if (qLower.includes('why') && (qLower.includes('bad') || qLower.includes('blunder') || qLower.includes('mistake') || qLower.includes('wrong') || qLower.includes('inaccuracy'))) {
    if (currentMove && ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(classification)) {
      return `${personaPrefix}${san} gave away a ${Math.abs(currentMove.winChanceDelta).toFixed(1)}% win chance advantage. Instead of ${san}, the computer engine strongly preferred ${bestSan}, which preserves piece coordination and prevents ${opponent}'s tactical threats.`;
    }
    return `${personaPrefix}In this position (${currentFen.split(' ')[0]}), piece activity and king safety are paramount. Always look for undefended pieces and open files before making your move.`;
  }

  // 2. Question about the best move or what to play
  if (qLower.includes('best move') || qLower.includes('what should') || qLower.includes('recommend') || qLower.includes('what to play') || qLower.includes('idea')) {
    if (bestSan) {
      return `${personaPrefix}The top computer recommendation is **${bestSan}**. This move maximizes piece activity, controls key central squares, and limits ${opponent}'s counterplay.`;
    }
    return `${personaPrefix}Focus on developing all minor pieces, securing king safety via castling, and controlling the central d4/d5/e4/e5 squares.`;
  }

  // 3. Question about king safety or castling
  if (qLower.includes('king') || qLower.includes('castle') || qLower.includes('f2') || qLower.includes('f7') || qLower.includes('h3') || qLower.includes('g2') || qLower.includes('g7')) {
    return `${personaPrefix}King safety is the #1 priority in chess. Leaving the king uncastled or creating pawn holes around the king shield allows tactical queen and rook invasions.`;
  }

  // 4. Question about pieces (knight, bishop, rook, queen, pawn)
  if (qLower.includes('knight') || qLower.includes('bishop') || qLower.includes('rook') || qLower.includes('queen') || qLower.includes('pawn')) {
    return `${personaPrefix}Every piece needs an active outpost. Knights thrive on closed central outposts, bishops need open diagonals, and rooks belong on open and semi-open files!`;
  }

  // 5. General fallback
  if (currentMove) {
    return `${personaPrefix}On turn ${currentMove.moveNumber}, ${player} played ${san} (${classification.toUpperCase()}). ${currentMove.coachComment || 'Focus on maintaining initiative and calculating forced checks and captures before moving.'}`;
  }

  return `${personaPrefix}Examine the position closely: calculate checks, captures, and threats (CCT). Keep your pieces coordinated and control the center!`;
}

export class GeminiCoachService {
  private getClient(apiKey?: string): GoogleGenAI | null {
    const key = apiKey || getStoredApiKey();
    if (!key) return null;
    try {
      return new GoogleGenAI({ apiKey: key });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }

  private async callGeminiWithTimeout(client: GoogleGenAI, prompt: string, timeoutMs: number = 6000): Promise<string | null> {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const model of modelsToTry) {
      try {
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), timeoutMs)
        );

        const generatePromise = client.models.generateContent({
          model,
          contents: prompt,
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        console.warn(`Gemini model ${model} attempt failed:`, err?.message || err);
        // continue to next model or fallback
      }
    }
    return null;
  }

  /**
   * Generates a deep, natural-language explanation for a specific move in the game.
   */
  public async explainMove(
    move: MoveAnalysis,
    persona: CoachPersona = 'grandmaster',
    apiKey?: string
  ): Promise<string> {
    const client = this.getClient(apiKey);
    if (!client) {
      return move.coachComment || 'Stockfish evaluation complete.';
    }

    const personaInstructions = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.grandmaster;
    const player = move.turn === 'w' ? 'White' : 'Black';
    const opponent = move.turn === 'w' ? 'Black' : 'White';
    const tactics = analyzeTactics(move.fenBefore, move.fenAfter, move.san, move.turn);

    const prompt = `${personaInstructions}

Analyze this chess move for the student:
- Move Played: ${move.san} by ${player} (Turn ${move.moveNumber})
- Move Classification: ${move.classification.toUpperCase()}
- Board FEN Before: ${move.fenBefore}
- Board FEN After: ${move.fenAfter}
- Best Engine Move: ${move.bestMoveSan || move.bestMove}
- Win Chance Change: ${move.winChanceDelta > 0 ? '+' : ''}${move.winChanceDelta.toFixed(1)}%
- Tactical Motifs: ${tactics.tacticalThemes.join(', ')}
- Material Sacrifice: ${move.isSacrifice ? 'Yes (Material given up)' : 'No'}
- King State: ${tactics.isKingExposed ? 'King shield weakened / open lines' : 'Safe'}
- Check / Capture: ${tactics.isCheck ? 'Delivers Check' : tactics.isCapture ? 'Capture' : 'Positional move'}

Write a 2-3 sentence coaching breakdown:
1. Explain the concrete tactical/strategic reason for why ${move.san} was ${move.classification}.
2. If it was a mistake or blunder, explain the tactical refutation that ${opponent} can exploit, and explain why ${move.bestMoveSan} was better.
3. If it was a brilliant or great move, highlight the tactical foresight.
Keep it punchy, instructive, and directly referencing key squares. Max 70 words.`;

    const text = await this.callGeminiWithTimeout(client, prompt, 6000);
    return text || move.coachComment || '';
  }

  /**
   * Generates coaching advice on an arbitrary custom position / sandbox setup.
   */
  public async explainCustomPosition(
    fen: string,
    topMoveText: string = '',
    persona: CoachPersona = 'grandmaster',
    apiKey?: string
  ): Promise<string> {
    const client = this.getClient(apiKey);
    if (!client) {
      return generateLocalCoachAnswer('evaluate position and best plan', null, fen, persona);
    }

    const personaInstructions = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.grandmaster;
    const prompt = `${personaInstructions}

Current Custom Chess Position:
- FEN: ${fen}
${topMoveText ? `- Engine Candidate Analysis: ${topMoveText}` : ''}

Provide a 2-3 sentence strategic explanation for the student:
1. Assess which side has the initiative or advantage and why.
2. Outline the immediate threats, weak squares, and the best plan for the side to move.
Keep it punchy, instructive, and under 70 words.`;

    const text = await this.callGeminiWithTimeout(client, prompt, 6000);
    return text || generateLocalCoachAnswer('evaluate position and best plan', null, fen, persona);
  }

  /**
   * Interactive Q&A with the Coach for any question regarding the board.
   */
  public async askCoachQuestion(
    question: string,
    currentMove: MoveAnalysis | null,
    currentFen: string,
    chatHistory: { sender: 'coach' | 'user'; text: string }[],
    persona: CoachPersona = 'grandmaster',
    apiKey?: string
  ): Promise<string> {
    const client = this.getClient(apiKey);
    if (!client) {
      return generateLocalCoachAnswer(question, currentMove, currentFen, persona);
    }

    const personaInstructions = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.grandmaster;
    const historyContext = chatHistory
      .slice(-4)
      .map((m) => `${m.sender === 'user' ? 'Student' : 'Coach'}: ${m.text}`)
      .join('\n');

    const prompt = `${personaInstructions}

Current Board Position:
- FEN: ${currentFen}
${currentMove ? `- Last move played: ${currentMove.san} (${currentMove.turn === 'w' ? 'White' : 'Black'}) classified as ${currentMove.classification}` : ''}
${currentMove?.bestMoveSan ? `- Engine best move was: ${currentMove.bestMoveSan}` : ''}

Conversation History:
${historyContext}

Student's Question: "${question}"

Provide a clear, master-level chess tutor response answering the question directly. Reference specific pieces, squares, tactics, and plans. Keep it crisp, instructional, and under 90 words.`;

    const text = await this.callGeminiWithTimeout(client, prompt, 6000);
    return text || generateLocalCoachAnswer(question, currentMove, currentFen, persona);
  }
}

export const geminiCoachService = new GeminiCoachService();
