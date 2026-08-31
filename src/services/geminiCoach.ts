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
    'You are a World-Class Grandmaster Chess Coach (in the style of Chess.com Game Review Coach). You provide sharp, concrete, and deeply insightful chess analysis. You highlight piece coordination, pawn structure weaknesses, tactical motifs (pins, forks, skewers, deflection, king safety), and concrete lines.',
  strict:
    'You are Grandmaster Boris, a strict, no-nonsense Russian Chess Master. You are blunt, demanding, and direct. You point out tactical carelessness, criticize lazy pawn moves, and demand sharp calculation.',
  friendly:
    'You are Coach Emma, an encouraging, friendly chess mentor. You explain chess strategy with clear, memorable analogies, explain why blunders happen without discouraging the player, and celebrate good tactical ideas.',
  witty:
    'You are Coach Blitz, a witty, energetic chess streamer. You use chess humor, dynamic commentary, and lively analogies while delivering master-level tactical insights.',
};

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
Keep it punchy, instructive, and directly referencing key squares (e.g. f3, f2, h3, d4). Max 70 words.`;

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || move.coachComment || '';
    } catch (err) {
      console.error('Gemini API move explanation error:', err);
      return move.coachComment || '';
    }
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
      return 'Please enter your Gemini API Key in Settings (top right) to chat live with the AI Chess Coach!';
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

    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "Focus on piece coordination, controlling key central squares, and safeguarding your king.";
    } catch (err) {
      console.error('Gemini API chat error:', err);
      return "Sorry, I couldn't reach the AI coaching engine. Please verify your API key in Settings.";
    }
  }
}

export const geminiCoachService = new GeminiCoachService();
