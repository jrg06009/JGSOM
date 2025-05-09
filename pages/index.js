
import fs from 'fs'
import path from 'path'
import Link from 'next/link'

export async function getStaticProps() {
  const games = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'games.json'), 'utf8'))
  const players = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'players.json'), 'utf8'))
  const teams = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'teams.json'), 'utf8'))

  return {
    props: {
      games,
      players,
      teams
    }
  }
}

export default function Home({ games, players, teams }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to the 1999 Strat-O-Matic Season Replay</h1>

      <h2 className="text-xl font-semibold mt-6 mb-2">Recent Games</h2>
      <ul className="mb-6">
        {games && games.slice(0, 5).map((game, idx) => (
          <li key={idx}>
            <Link href={`/boxscores/${game.id}`} className="text-blue-600 underline">
              {game.date}: {game.away} @ {game.home} — {game.result}
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Teams</h2>
      <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {teams && teams.map((team, idx) => (
          <li key={idx} className="border rounded p-2 bg-white shadow hover:shadow-md transition">
            <Link href={`/teams/${team.id}`} className="block text-center text-lg text-blue-700">
              {team.name}
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">Player Count</h2>
      <p>{players?.length || 0} players loaded.</p>
    </div>
  )
}

function calculateStandings(teams, games) {
  const standings = Object.fromEntries(teams.map(t => [t.id, { ...t, w: 0, l: 0 }]));

  for (const game of games) {
    const { home, away, home_score, away_score } = game;

    if (!(home in standings) || !(away in standings)) continue;

    if (home_score > away_score) {
      standings[home].w += 1;
      standings[away].l += 1;
    } else {
      standings[away].w += 1;
      standings[home].l += 1;
    }
  }

  const sorted = Object.values(standings)
    .map(t => ({
      ...t,
      gb: 0 // to be calculated next
    }))
    .sort((a, b) => b.w - a.w || a.l - b.l);

  const topWins = sorted[0]?.w || 0;
  const topLosses = sorted[0]?.l || 0;

  for (const team of sorted) {
    team.gb = ((topWins - team.w) + (team.l - topLosses)) / 2;
  }

  return sorted;
}
