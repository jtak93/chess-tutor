import type { GameReviewReport, MoveClassification } from '../types/chess';

const NAG_MAP: Partial<Record<MoveClassification, string>> = {
  brilliant: '$3',   // !! Very good move / Brilliant
  great: '$1',       // ! Good move
  best: '$1',        // ! Good move
  good: '',
  book: '',
  inaccuracy: '$6',  // ?! Dubious move / Inaccuracy
  mistake: '$2',     // ? Mistake
  miss: '$2',        // ? Mistake
  blunder: '$4',     // ?? Blunder
};

/**
 * Encodes a PGN into a shareable URL hash with zero server/backend dependency.
 */
export function encodeGameToUrl(pgn: string): string {
  try {
    const cleanPgn = pgn.trim();
    const encoded = encodeURIComponent(cleanPgn);
    return `${window.location.origin}${window.location.pathname}#pgn=${encoded}`;
  } catch {
    return window.location.href;
  }
}

/**
 * Reads and decodes a PGN from the current window location URL hash.
 */
export function decodeGameFromUrl(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (hash.startsWith('#pgn=')) {
      const encoded = hash.substring(5);
      return decodeURIComponent(encoded);
    }
  } catch (err) {
    console.warn('Failed to parse PGN from URL hash:', err);
  }
  return null;
}

/**
 * Exports a full annotated PGN string with Stockfish evaluations, NAG symbols, and AI commentary.
 */
export function exportAnnotatedPgn(report: GameReviewReport): string {
  const { metadata, moves, whiteAccuracy, blackAccuracy } = report;

  const headerLines: string[] = [
    `[Event "${metadata.event || 'Chess Tutor Game Review'}"]`,
    `[Site "${metadata.site || 'https://chess-tutor.app'}"]`,
    `[Date "${metadata.date || new Date().toISOString().split('T')[0]}"]`,
    `[White "${metadata.white || 'White'}"]`,
    `[Black "${metadata.black || 'Black'}"]`,
    `[Result "${metadata.result || '*'}"]`,
    `[WhiteElo "${metadata.whiteElo || '?'}"]`,
    `[BlackElo "${metadata.blackElo || '?'}"]`,
    `[WhiteAccuracy "${whiteAccuracy}%"]`,
    `[BlackAccuracy "${blackAccuracy}%"]`,
    `[Annotator "Stockfish 18 & Chess Tutor AI"]`,
  ];

  if (metadata.eco) headerLines.push(`[ECO "${metadata.eco}"]`);
  if (metadata.opening) headerLines.push(`[Opening "${metadata.opening}"]`);

  const moveTokens: string[] = [];

  for (let i = 0; i < moves.length; i++) {
    const m = moves[i];
    const moveNum = Math.floor(i / 2) + 1;

    if (m.turn === 'w') {
      moveTokens.push(`${moveNum}.`);
    } else if (i === 0 && m.turn === 'b') {
      moveTokens.push(`${moveNum}...`);
    }

    const nag = NAG_MAP[m.classification] ? ` ${NAG_MAP[m.classification]}` : '';
    let annotation = `${m.san}${nag}`;

    const comments: string[] = [];

    // Eval comment
    if (m.evalAfter) {
      const evalStr = m.evalAfter.type === 'mate'
        ? `M${m.evalAfter.whiteValue}`
        : `${(m.evalAfter.whiteValue / 100).toFixed(2)}`;
      comments.push(`[%eval ${evalStr}]`);
    }

    // Coach classification note
    if (['brilliant', 'great', 'blunder', 'mistake', 'miss'].includes(m.classification)) {
      comments.push(`${m.classification.toUpperCase()}: ${m.coachComment || ''}`);
    }

    if (comments.length > 0) {
      annotation += ` {${comments.join(' ')}}`;
    }

    moveTokens.push(annotation);
  }

  if (metadata.result && metadata.result !== '*') {
    moveTokens.push(metadata.result);
  }

  return `${headerLines.join('\n')}\n\n${moveTokens.join(' ')}`;
}

/**
 * Generates a high-res, beautifully styled PNG scorecard canvas ready for social sharing.
 */
export async function generateScorecardCanvas(report: GameReviewReport): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGrad.addColorStop(0, '#161512');
  bgGrad.addColorStop(0.5, '#1e1d1a');
  bgGrad.addColorStop(1, '#11100e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 630);

  // Decorative border
  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 1168, 598);

  // 2. Header Branding
  ctx.fillStyle = '#81b64c';
  ctx.font = 'bold 28px Inter, sans-serif';
  ctx.fillText('♞ CHESS TUTOR', 50, 70);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '500 18px Inter, sans-serif';
  ctx.fillText('AI Game Review & Accuracy Report', 270, 70);

  // Watermark URL
  ctx.fillStyle = '#71717a';
  ctx.font = '500 16px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('chess-tutor.app', 1150, 70);
  ctx.textAlign = 'left';

  // Divider
  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 95);
  ctx.lineTo(1150, 95);
  ctx.stroke();

  // 3. Player Cards (White vs Black)
  // White Box
  ctx.fillStyle = '#262522';
  ctx.beginPath();
  ctx.roundRect(50, 120, 520, 240, 16);
  ctx.fill();
  ctx.strokeStyle = '#3f3f46';
  ctx.stroke();

  // White Player Header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Inter, sans-serif';
  ctx.fillText(report.metadata.white || 'White Player', 80, 165);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText(`Rating: ${report.metadata.whiteElo || '?'} • Est. Elo: ~${report.whiteEstimatedElo || '?'}`, 80, 195);

  // White Accuracy
  ctx.fillStyle = '#81b64c';
  ctx.font = 'bold 56px Inter, sans-serif';
  ctx.fillText(`${report.whiteAccuracy}%`, 80, 275);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText('CAPS2 Accuracy', 80, 315);

  // Black Box
  ctx.fillStyle = '#262522';
  ctx.beginPath();
  ctx.roundRect(630, 120, 520, 240, 16);
  ctx.fill();
  ctx.strokeStyle = '#3f3f46';
  ctx.stroke();

  // Black Player Header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Inter, sans-serif';
  ctx.fillText(report.metadata.black || 'Black Player', 660, 165);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText(`Rating: ${report.metadata.blackElo || '?'} • Est. Elo: ~${report.blackEstimatedElo || '?'}`, 660, 195);

  // Black Accuracy
  ctx.fillStyle = '#81b64c';
  ctx.font = 'bold 56px Inter, sans-serif';
  ctx.fillText(`${report.blackAccuracy}%`, 660, 275);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText('CAPS2 Accuracy', 660, 315);

  // 4. Move Breakdown Badges Grid (Bottom Section)
  ctx.fillStyle = '#1e1d1a';
  ctx.beginPath();
  ctx.roundRect(50, 385, 1100, 185, 16);
  ctx.fill();
  ctx.strokeStyle = '#3f3f46';
  ctx.stroke();

  // Move Stats Table
  const counts = report.classificationCounts;
  const statColumns = [
    { label: 'Brilliant', color: '#1baaa0', w: counts.w.brilliant, b: counts.b.brilliant },
    { label: 'Great', color: '#5c8bb0', w: counts.w.great, b: counts.b.great },
    { label: 'Best', color: '#81b64c', w: counts.w.best, b: counts.b.best },
    { label: 'Excellent', color: '#96bc4b', w: counts.w.excellent, b: counts.b.excellent },
    { label: 'Inaccuracies', color: '#f7c631', w: counts.w.inaccuracy, b: counts.b.inaccuracy },
    { label: 'Mistakes', color: '#e6912c', w: counts.w.mistake, b: counts.b.mistake },
    { label: 'Blunders', color: '#ca3431', w: counts.w.blunder, b: counts.b.blunder },
  ];

  const colWidth = 150;
  const startX = 75;

  statColumns.forEach((col, idx) => {
    const x = startX + idx * colWidth;

    // Label
    ctx.fillStyle = col.color;
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText(col.label, x, 425);

    // White count
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText(`W: ${col.w}`, x, 470);

    // Black count
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText(`B: ${col.b}`, x, 515);
  });

  // Footer Tagline
  ctx.fillStyle = '#71717a';
  ctx.font = 'italic 14px Inter, sans-serif';
  ctx.fillText(
    report.summary.openingSummary || 'Analyzed with Stockfish 18 multi-core engine & AI Grandmaster feedback.',
    50,
    600
  );

  return canvas;
}

/**
 * Exports the scorecard as a downloadable PNG image.
 */
export async function downloadScorecardImage(report: GameReviewReport, filename = 'chess-tutor-review.png') {
  const canvas = await generateScorecardCanvas(report);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
