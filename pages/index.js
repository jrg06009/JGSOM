import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import StandingsTable from '../components/StandingsTable'
import { getQualificationThresholds } from '../components/getQualificationThresholds'

function safeLoad(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (e) {
    console.warn(`Warning: Could not load ${filePath}`)
    return []
  }
}

export async function getStaticProps() {
  const dataDir = path.join(process.cwd(), 'data', 'stats')

  const standings = safeLoad(path.join(dataDir, 'standings.json'))
  const schedule = safeLoad(path.join(dataDir, 'schedule.json'))
  const linescores = safeLoad(path.join(dataDir, 'linescores.json'))
  const batting = safeLoad(path.join(dataDir, 'batting.json'))
  const pitching = safeLoad(path.join(dataDir, 'pitching.json'))

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
            <Link href={`/players/${p.id}`} className="text-blue-600 hover:underline">{p.Player}</Link> ({p[statKey]})
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function Home({ standings, schedule, linescores, batting, pitching }) {
  const recentGames = getRecentGames(schedule, linescores)
  const thresholds = getQualificationThresholds()

  const avgQualified = batting.filter(p => {
    const pa = parseFloat(p.PA || 0)
    const threshold = thresholds[p.team]?.PA || Infinity
    return pa >= threshold
  })

  const eraQualified = pitching.filter(p => {
    const ip = parseFloat(p.IP || 0)
    const threshold = thresholds[p.team]?.IP || Infinity
    return ip >= threshold
  })
  
  const leaders = {
    avg: getLeaders(avgQualified, 'AVG'),
    hr: getLeaders(batting, 'HR'),
    rbi: getLeaders(batting, 'RBI'),
    wins: getLeaders(pitching, 'W'),
    era: getLeaders(eraQualified, 'ERA', 5, true).sort((a, b) => parseFloat(a.ERA) - parseFloat(b.ERA)),
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:grid-cols-3 gap-4">
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
