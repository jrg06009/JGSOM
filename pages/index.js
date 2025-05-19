import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import StandingsTable from '../components/StandingsTable'

export async function getStaticProps() {
  const games = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'games.json'), 'utf8'))
  const players = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'players.json'), 'utf8'))
  const teams = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'teams.json'), 'utf8'))
  const standings = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'stats', 'standings.json'), 'utf8'))

  return {
    props: {
      games,
      players,
      teams,
      standings
    }
  }
}

export default function Home({ games, players, teams, standings }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to the 1999 Strat-O-Matic Season</h1>

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

      <h2 className="text-xl font-semibold mt-6 mb-2">Standings</h2>
      <StandingsTable standings={standings} teams={teams} useFullName={false} />

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
    </div>
  )
}
