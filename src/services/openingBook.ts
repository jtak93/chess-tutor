/**
 * ECO Opening Database for book move identification and opening names.
 * Maps standard FEN prefix or move sequence to ECO Code and Name.
 */

export interface OpeningInfo {
  eco: string;
  name: string;
  moves: string[]; // SAN moves
}

export const OPENINGS_DATABASE: OpeningInfo[] = [
  // King's Pawn Openings
  { eco: 'C50', name: 'Italian Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
  { eco: 'C51', name: 'Evans Gambit', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'] },
  { eco: 'C54', name: 'Italian Game: Giuoco Piano', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4'] },
  { eco: 'C55', name: 'Two Knights Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'] },
  { eco: 'C57', name: 'Fried Liver Attack', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7'] },
  { eco: 'C60', name: 'Ruy Lopez', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
  { eco: 'C65', name: 'Ruy Lopez: Berlin Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'] },
  { eco: 'C70', name: 'Ruy Lopez: Morphy Defense', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'] },
  { eco: 'C78', name: 'Ruy Lopez: Closed Variation', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'] },
  { eco: 'C45', name: 'Scotch Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
  { eco: 'C42', name: 'Petrov Defense', moves: ['e4', 'e5', 'Nf3', 'Nf6'] },
  { eco: 'C20', name: "King's Pawn Game", moves: ['e4', 'e5'] },
  { eco: 'C30', name: "King's Gambit", moves: ['e4', 'e5', 'f4'] },
  { eco: 'C33', name: "King's Gambit Accepted", moves: ['e4', 'e5', 'f4', 'exf4'] },
  { eco: 'C21', name: 'Center Game', moves: ['e4', 'e5', 'd4', 'exd4'] },
  { eco: 'C22', name: 'Center Game: Paulsen Attack', moves: ['e4', 'e5', 'd4', 'exd4', 'Qxd4', 'Nc6', 'Qe3'] },
  { eco: 'C24', name: "Bishop's Opening", moves: ['e4', 'e5', 'Bc4'] },
  { eco: 'C41', name: 'Philidor Defense', moves: ['e4', 'e5', 'Nf3', 'd6'] },
  { eco: 'C44', name: 'Ponziani Opening', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'c3'] },
  { eco: 'C47', name: 'Four Knights Game', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6'] },

  // Sicilian Defense
  { eco: 'B20', name: 'Sicilian Defense', moves: ['e4', 'c5'] },
  { eco: 'B21', name: 'Sicilian Defense: Smith-Morra Gambit', moves: ['e4', 'c5', 'd4', 'cxd4', 'c3'] },
  { eco: 'B22', name: 'Sicilian Defense: Alapin Variation', moves: ['e4', 'c5', 'c3'] },
  { eco: 'B23', name: 'Sicilian Defense: Closed', moves: ['e4', 'c5', 'Nc3'] },
  { eco: 'B30', name: 'Sicilian Defense: Old Sicilian', moves: ['e4', 'c5', 'Nf3', 'Nc6'] },
  { eco: 'B50', name: 'Sicilian Defense: Modern Variations', moves: ['e4', 'c5', 'Nf3', 'd6'] },
  { eco: 'B90', name: 'Sicilian Defense: Najdorf Variation', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },
  { eco: 'B70', name: 'Sicilian Defense: Dragon Variation', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'] },
  { eco: 'B80', name: 'Sicilian Defense: Scheveningen Variation', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e6'] },
  { eco: 'B33', name: 'Sicilian Defense: Sveshnikov Variation', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e5'] },
  { eco: 'B40', name: 'Sicilian Defense: French Variation', moves: ['e4', 'c5', 'Nf3', 'e6'] },

  // French & Caro-Kann
  { eco: 'C00', name: 'French Defense', moves: ['e4', 'e6'] },
  { eco: 'C02', name: 'French Defense: Advance Variation', moves: ['e4', 'e6', 'd4', 'd5', 'e5'] },
  { eco: 'C05', name: 'French Defense: Tarrasch Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nd2'] },
  { eco: 'C10', name: 'French Defense: Paulsen Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3'] },
  { eco: 'C11', name: 'French Defense: Steinitz Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'e5'] },
  { eco: 'C15', name: 'French Defense: Winawer Variation', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'] },
  { eco: 'B10', name: 'Caro-Kann Defense', moves: ['e4', 'c6'] },
  { eco: 'B12', name: 'Caro-Kann Defense: Advance Variation', moves: ['e4', 'c6', 'd4', 'd5', 'e5'] },
  { eco: 'B13', name: 'Caro-Kann Defense: Exchange Variation', moves: ['e4', 'c6', 'd4', 'd5', 'exd5', 'cxd5'] },
  { eco: 'B18', name: 'Caro-Kann Defense: Classical Variation', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'] },

  // Other 1.e4 Responses
  { eco: 'B01', name: 'Scandinavian Defense', moves: ['e4', 'd5'] },
  { eco: 'B01', name: 'Scandinavian Defense: Mieses-Kotroc Variation', moves: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5'] },
  { eco: 'B07', name: 'Pirc Defense', moves: ['e4', 'd6', 'd4', 'Nf6'] },
  { eco: 'B02', name: 'Alekhine Defense', moves: ['e4', 'Nf6'] },
  { eco: 'B06', name: 'Modern Defense', moves: ['e4', 'g6'] },

  // Queen's Pawn Openings
  { eco: 'D00', name: "Queen's Pawn Game", moves: ['d4', 'd5'] },
  { eco: 'D02', name: 'London System', moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'] },
  { eco: 'D06', name: "Queen's Gambit", moves: ['d4', 'd5', 'c4'] },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: ['d4', 'd5', 'c4', 'dxc4'] },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: ['d4', 'd5', 'c4', 'e6'] },
  { eco: 'D35', name: "Queen's Gambit Declined: Exchange Variation", moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'cxd5', 'exd5'] },
  { eco: 'D10', name: 'Slav Defense', moves: ['d4', 'd5', 'c4', 'c6'] },
  { eco: 'D43', name: 'Semi-Slav Defense', moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'e6'] },
  { eco: 'E60', name: "King's Indian Defense", moves: ['d4', 'Nf6', 'c4', 'g6'] },
  { eco: 'E70', name: "King's Indian Defense: Normal Variation", moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6'] },
  { eco: 'E97', name: "King's Indian Defense: Mar del Plata Variation", moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6', 'd5', 'Ne7'] },
  { eco: 'E20', name: 'Nimzo-Indian Defense', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
  { eco: 'E00', name: 'Catalan Opening', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3'] },
  { eco: 'E12', name: "Queen's Indian Defense", moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'] },
  { eco: 'A56', name: 'Benoni Defense', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5'] },
  { eco: 'A80', name: 'Dutch Defense', moves: ['d4', 'f5'] },
  { eco: 'A40', name: "Queen's Pawn Opening", moves: ['d4'] },

  // Flank Openings
  { eco: 'A10', name: 'English Opening', moves: ['c4'] },
  { eco: 'A15', name: 'English Opening: Anglo-Indian Defense', moves: ['c4', 'Nf6'] },
  { eco: 'A20', name: "English Opening: King's English Variation", moves: ['c4', 'e5'] },
  { eco: 'A04', name: 'Reti Opening', moves: ['Nf3'] },
  { eco: 'A00', name: 'Grob Opening', moves: ['g4'] },
  { eco: 'B00', name: 'Nimzowitsch Defense', moves: ['e4', 'Nc6'] },
];

/**
 * Given a sequence of SAN moves, finds the best matching ECO Opening and name,
 * and determines if a move at a given ply is recognized as "Book".
 */
export function identifyOpening(moveSans: string[]): { eco: string; name: string; bookPlies: number } {
  let bestMatch: OpeningInfo = { eco: 'A00', name: 'Unknown Opening', moves: [] };
  let maxMatchedMoves = 0;

  for (const opening of OPENINGS_DATABASE) {
    let matches = 0;
    for (let i = 0; i < opening.moves.length && i < moveSans.length; i++) {
      if (opening.moves[i] === moveSans[i]) {
        matches++;
      } else {
        break;
      }
    }

    if (matches > maxMatchedMoves && matches === opening.moves.length) {
      maxMatchedMoves = matches;
      bestMatch = opening;
    } else if (matches > maxMatchedMoves && matches >= 1) {
      maxMatchedMoves = matches;
      bestMatch = opening;
    }
  }

  return {
    eco: bestMatch.eco,
    name: bestMatch.name,
    bookPlies: maxMatchedMoves,
  };
}

/**
 * Checks if a specific move at `ply` in `moveSans` is within known opening theory.
 */
export function isBookMove(moveSans: string[], ply: number): boolean {
  if (ply < 0 || ply >= moveSans.length) return false;
  
  // Test if the prefix up to ply + 1 matches any known opening line
  const prefix = moveSans.slice(0, ply + 1);
  return OPENINGS_DATABASE.some(op => {
    if (op.moves.length < prefix.length) return false;
    return prefix.every((m, idx) => op.moves[idx] === m);
  });
}
