export interface FetchedGameInfo {
  id: string;
  source: 'chess.com' | 'lichess';
  white: string;
  black: string;
  whiteElo?: string;
  blackElo?: string;
  result: string;
  timeControl?: string;
  date: string;
  pgn: string;
  url?: string;
}

export async function fetchChessComGames(username: string): Promise<FetchedGameInfo[]> {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername) throw new Error('Please enter a valid Chess.com username.');

  // Fetch monthly archives list
  const archiveRes = await fetch(`https://api.chess.com/pub/player/${cleanUsername}/games/archives`);
  if (!archiveRes.ok) {
    if (archiveRes.status === 404) {
      throw new Error(`Chess.com user "${username}" not found.`);
    }
    throw new Error(`Failed to fetch Chess.com user data (${archiveRes.status}).`);
  }

  const archiveData = await archiveRes.json();
  const archives: string[] = archiveData.archives || [];
  if (archives.length === 0) {
    throw new Error(`No games found for ${username}.`);
  }

  // Get the most recent month archive
  const latestMonthUrl = archives[archives.length - 1];
  const gamesRes = await fetch(latestMonthUrl);
  if (!gamesRes.ok) throw new Error('Failed to fetch recent games.');

  const gamesData = await gamesRes.json();
  const games = gamesData.games || [];

  // Return last 10 games in reverse chronological order
  return games.slice(-10).reverse().map((g: any, index: number) => {
    let result = '*';
    if (g.white.result === 'win') result = '1-0';
    else if (g.black.result === 'win') result = '0-1';
    else result = '1/2-1/2';

    const dateStr = g.end_time ? new Date(g.end_time * 1000).toLocaleDateString() : 'Recent';

    return {
      id: `chesscom-${index}-${g.end_time || Date.now()}`,
      source: 'chess.com',
      white: g.white.username,
      black: g.black.username,
      whiteElo: g.white.rating?.toString(),
      blackElo: g.black.rating?.toString(),
      result,
      timeControl: g.time_class || g.time_control,
      date: dateStr,
      pgn: g.pgn || '',
      url: g.url,
    };
  });
}

export async function fetchLichessGames(username: string): Promise<FetchedGameInfo[]> {
  const cleanUsername = username.trim();
  if (!cleanUsername) throw new Error('Please enter a valid Lichess username.');

  const res = await fetch(`https://lichess.org/api/games/user/${cleanUsername}?max=10&pgnInJson=true`, {
    headers: {
      Accept: 'application/x-ndjson',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Lichess user "${username}" not found.`);
    }
    throw new Error(`Failed to fetch Lichess user data (${res.status}).`);
  }

  const text = await res.text();
  const lines = text.trim().split('\n').filter(Boolean);

  return lines.map((line, index) => {
    const g = JSON.parse(line);
    let result = '*';
    if (g.winner === 'white') result = '1-0';
    else if (g.winner === 'black') result = '0-1';
    else if (g.status === 'draw' || g.status === 'stalemate') result = '1/2-1/2';

    const dateStr = g.createdAt ? new Date(g.createdAt).toLocaleDateString() : 'Recent';

    return {
      id: `lichess-${index}-${g.id}`,
      source: 'lichess',
      white: g.players?.white?.user?.name || 'Anonymous',
      black: g.players?.black?.user?.name || 'Anonymous',
      whiteElo: g.players?.white?.rating?.toString(),
      blackElo: g.players?.black?.rating?.toString(),
      result,
      timeControl: g.speed,
      date: dateStr,
      pgn: g.pgn || '',
      url: `https://lichess.org/${g.id}`,
    };
  });
}
