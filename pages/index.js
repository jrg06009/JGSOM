import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import StandingsTable from '../components/StandingsTable'

export async function getStaticProps() {
  const dataDir = path.join(process.cwd(), 'data', 'stats')

  const standings = JSON.parse(fs.readFileSync(path.join(dataDir, 'standings.json'), 'utf8'))
  const schedule = JSON.parse(fs.readFileSync(path.join(dataDir, 'schedule.json'), 'utf8'))
  const linescores = JSON.parse(fs.readFileSync(path.join(dataDir, 'linescores.json'), 'utf8'))
  const batting = JSON.parse(fs.readFileSync(path.join(dataDir, 'batting.json'), 'utf8'))
  const pitching = JSON.parse(fs.readFileSync(path.join(dataDir, 'pitching.json'), 'utf8'))

  return {
    props: {
      standings,
      schedule,
      linescores,
      batting,
      pitching,
    },
  }
}

function getRecentGames(schedule, linescores) {
  const played = schedule.filter(g => g.score && g.score.length > 0)
  const recent = played.slice(-3).reverse()
  return recent.map(game => {
    const line = linescores.find(l => l.game_id === game.game_id)
    return { ...game, linescore: line }
  })
}

function getLeaders(data, key, top = 5, isPitcher = false) {
  const filtered = data.filter(p => parseFloat(p[key]) > 0)
  const sorted = filtered.sort((a, b) => parseFloat(b[key]) - parseFloat(a[key]))
  return sorted.slice(0, top)
}

function LeaderList({ title, players, statKey }) {
  return (
    <div className="border rounded-xl p-3 bg-white shadow">
      <h3 className="font-bold mb-2 text-lg">{title}</h3>
      <ol className="list-decimal list-inside space-y-1 text-sm">
        {players.map((p, i) => (
          <li key={i}>
            <Link href={`/players/${p.id}`} className="text-blue-600 hover:underline">{p.name}</Link> ({p[statKey]})
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function Home({ standings, schedule, linescores, batting, pitching }) {
  const recentGames = getRecentGames(schedule, linescores)

  const leaders = {
    avg: getLeaders(batting, 'AVG'),
    hr: getLeaders(batting, 'HR'),
    rbi: getLeaders(batting, 'RBI'),
    wins: getLeaders(pitching, 'W'),
    era: getLeaders(pitching, 'ERA', 5, true).sort((a, b) => parseFloat(a.ERA) - parseFloat(b.ERA)),
    so: getLeaders(pitching, 'SO'),
  }

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-3xl font-bold">1999 Strat-O-Matic Season</h1>

      <section>
        <h2 className="text-xl font-semibold mb-2">Recent Games</h2>
        {recentGames.map((game, idx) => (
          <div key={idx} className="border rounded-xl p-4 bg-white shadow mb-3">
            <div className="font-semibold mb-1">{game.date} — {game.road} at {game.home}</div>
            {game.linescore && (
              <div className="text-sm font-mono mb-1">
                {game.linescore.innings.join(' ')}
              </div>
            )}
            <div className="text-sm">
              W: {game.wp || '—'}, L: {game.lp || '—'}{game.sv ? `, SV: ${game.sv}` : ''}
            </div>
            <Link href={`/boxscores/${game.game_id}`} className="text-blue-600 hover:underline text-sm">View Boxscore</Link>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Stat Leaders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LeaderList title="Batting Average" players={leaders.avg} statKey="AVG" />
          <LeaderList title="Home Runs" players={leaders.hr} statKey="HR" />
          <LeaderList title="Runs Batted In" players={leaders.rbi} statKey="RBI" />
          <LeaderList title="Wins" players={leaders.wins} statKey="W" />
          <LeaderList title="Earned Run Average" players={leaders.era} statKey="ERA" />
          <LeaderList title="Strikeouts" players={leaders.so} statKey="SO" />
        </div>
      </section>

      <section>
      <h2 className="text-xl font-semibold mt-6 mb-2">Standings</h2>
      <StandingsTable standings={standings} />
      </section>
    </div>
  )
}
