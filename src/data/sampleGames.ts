export interface SampleGame {
  id: string;
  title: string;
  subtitle: string;
  white: string;
  black: string;
  result: string;
  date: string;
  event: string;
  eco: string;
  opening: string;
  pgn: string;
  description: string;
  tags: string[];
}

export const SAMPLE_GAMES: SampleGame[] = [
  {
    id: 'user-game-nursalim7-takjam',
    title: 'nursalim7 vs takjam (Live Game)',
    subtitle: 'nursalim7 (1078) vs takjam (1100)',
    white: 'nursalim7',
    black: 'takjam',
    result: '0-1',
    date: '2026.08.31',
    event: 'Chess.com Live Chess',
    eco: 'B06',
    opening: 'Modern Defense: Standard Line',
    description: 'Black exploits White\'s kingside pawn structure weakness after 8...Bxf3 and 9.gxf3 Qh3, culminating in the queen sacrifice 15...Qxf2+! and decisive piece advantage.',
    tags: ['Recent Game', 'Queen Sac', 'Modern Defense'],
    pgn: `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.08.31"]
[Round "-"]
[White "nursalim7"]
[Black "takjam"]
[Result "0-1"]
[CurrentPosition "r3r1k1/ppp2p1p/3p2p1/1P2n1n1/P3P3/2Q2P2/2P1K2P/R4B2 w - - 0 25"]
[Timezone "UTC"]
[ECO "B06"]
[ECOUrl "https://www.chess.com/openings/Modern-Defense-Standard-Line-3...d6"]
[UTCDate "2026.08.31"]
[UTCTime "00:21:53"]
[WhiteElo "1078"]
[BlackElo "1100"]
[TimeControl "600"]
[Termination "takjam won - game abandoned"]
[StartTime "00:21:53"]
[EndDate "2026.08.31"]
[EndTime "00:36:42"]
[Link "https://www.chess.com/analysis/game/live/173770362298/analysis"]

1. e4 g6 2. d4 d6 3. Nc3 Bg7 4. Be3 Nf6 5. Bd3 O-O 6. Nf3 Bg4 7. O-O Qd7 8. Qd2
Bxf3 9. gxf3 Qh3 10. Bf4 Qxf3 11. Be2 Qh3 12. f3 Nc6 13. Rf2 Nh5 14. Bf1 Qh4 15.
Bg5 Qxf2+ 16. Kxf2 Bxd4+ 17. Ke2 Bc5 18. a3 Ng7 19. b4 Bd4 20. b5 Bxc3 21. Qxc3
Ne5 22. a4 Ne6 23. Bxe7 Rfe8 24. Bg5 Nxg5 0-1`,
  },
  {
    id: 'opera-game',
    title: 'The Opera Game (1858)',
    subtitle: 'Paul Morphy vs Duke of Brunswick & Count Isouard',
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    result: '1-0',
    date: '1858.11.02',
    event: 'Paris Opera House',
    eco: 'C41',
    opening: 'Philidor Defense: Morphy Gambit',
    description: 'Perhaps the most famous chess game of all time. Morphy demonstrates the devastating power of rapid piece development, open lines, and beautiful piece sacrifices.',
    tags: ['Masterpiece', 'Sacrifices', 'Romantic Era'],
    pgn: `[Event "Paris Opera House"]
[Site "Paris FRA"]
[Date "1858.11.02"]
[EventDate "?"]
[Round "?"]
[Result "1-0"]
[White "Paul Morphy"]
[Black "Duke of Brunswick and Count Isouard"]
[ECO "C41"]
[WhiteElo "?"]
[BlackElo "?"]
[PlyCount "33"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
  },
  {
    id: 'game-of-the-century',
    title: 'Game of the Century (1956)',
    subtitle: 'Donald Byrne vs Bobby Fischer (Age 13)',
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    result: '0-1',
    date: '1956.10.17',
    event: 'Rosenwald Memorial Tournament',
    eco: 'D92',
    opening: "Gruenfeld Defense: 5.Bf4",
    description: '13-year-old Bobby Fischer plays the sensational queen sacrifice 17...Be6!!, leading to an unstoppable windmill and checkmate.',
    tags: ['Brilliant', 'Queen Sacrifice', 'Fischer'],
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York, NY USA"]
[Date "1956.10.17"]
[Round "8"]
[Result "0-1"]
[White "Donald Byrne"]
[Black "Robert James Fischer"]
[ECO "D92"]
[WhiteElo "?"]
[BlackElo "?"]
[PlyCount "82"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`,
  },
  {
    id: 'kasparov-immortal',
    title: "Kasparov's Immortal (1999)",
    subtitle: 'Garry Kasparov vs Veselin Topalov',
    white: 'Garry Kasparov',
    black: 'Veselin Topalov',
    result: '1-0',
    date: '1999.01.20',
    event: 'Wijk aan Zee',
    eco: 'B07',
    opening: 'Pirc Defense: 4.Be3',
    description: "Kasparov executes one of the greatest attacking combinations in chess history starting with the unbelievable rook sacrifice 24.Rxd4!!",
    tags: ['Immortal', 'Kasparov', 'Attack'],
    pgn: `[Event "Hoogovens Group A"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[Round "4"]
[Result "1-0"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[ECO "B07"]
[WhiteElo "2812"]
[BlackElo "2700"]
[PlyCount "87"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`,
  },
];
