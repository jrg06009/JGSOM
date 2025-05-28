import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { useState } from 'react'
import StandingsTable from '../components/StandingsTable'
import { getQualificationThresholds } from '../components/getQualificationThresholds'
import { getTeamToLeagueMap } from '../lib/teamUtils'

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
  const teams = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'teams.json'), 'utf8'))
  const teamToLeague = getTeamToLeagueMap(teams)

  return {
    props: {
      standings,
      schedule,
      linescores,
      batting,
      pitching,
      teams,
      teamToLeague,
    },
  }
}

function getRecentGames(schedule, linescores) {
  const played = schedule.filter(g => {
    const line = linescores[g.game_id]
    return (
      g.completed === true &&
      !!line &&
      Array.isArray(line[g.home]) &&
      Array.isArray(line[g.road])
    )
  })

  const recent = played.slice(-3).reverse()

  
  return recent.map(game => {
    const linescore = linescores[game.game_id]
    return { ...game, linescore }
  })
}

function getLeaders(data, key, top = 5, isPitcher = false) {
  const filtered = data.filter(p => parseFloat(p[key]) > 0)
  const sorted = filtered.sort((a, b) => parseFloat(b[key]) - parseFloat(a[key]))
  return sorted.slice(0, top).map(p => ({ ...p, id: p["Player ID"] }))
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

export default function Home({ standings, schedule, linescores, batting, pitching, teamToLeague }) {
  const recentGames = getRecentGames(schedule, linescores)
  const thresholds = getQualificationThresholds()
  const [leaderLeague, setLeaderLeague] = useState('MLB')
  const isInLeague = (team) => {
    if (leaderLeague === 'MLB') return true
    return teamToLeague[team] === leaderLeague
  }
  const battingFiltered = batting.filter(p => isInLeague(p.team))
  const pitchingFiltered = pitching.filter(p => isInLeague(p.team))
    
  const avgQualified = battingFiltered.filter(p => {
    const pa = parseFloat(p.PA || 0)
    const threshold = thresholds[p.team]?.PA || Infinity
    return pa >= threshold
  })

  const eraQualified = pitchingFiltered.filter(p => {
    const ip = parseFloat(p.IP || 0)
    const threshold = thresholds[p.team]?.IP || Infinity
    return ip >= threshold
  })
  
  const leaders = {
    avg: getLeaders(avgQualified, 'AVG'),
    hr: getLeaders(battingFiltered, 'HR'),
    rbi: getLeaders(battingFiltered, 'RBI'),
    wins: getLeaders(pitchingFiltered, 'W'),
    era: eraQualified
      .filter(p => !isNaN(parseFloat(p.ERA)))
      .sort((a, b) => parseFloat(a.ERA) - parseFloat(b.ERA))
      .slice(0, 5)
      .map(p => ({ ...p, id: p["Player ID"] })),
    so: getLeaders(pitchingFiltered, 'SO'),
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
                {game.linescore[game.road]?.slice(0, 9).join(' ') || ''}<br />
                {game.linescore[game.home]?.slice(0, 9).join(' ') || ''}
              </div>
            )}
            <div className="text-sm">
              W: {game.wp || '—'}, L: {game.lp || '—'}{game.sv ? `, SV: ${game.sv}` : ''}
            </div>
            <Link href={`/boxscores/${game.game_id}`} className="text-blue-600 hover:underline text-sm">View Boxscore</Link>
          </div>
        ))}
      </section>

      <label className="flex items-center mb-2">
        <span className="mr-2 font-medium">Stat Leaders League:</span>
        <select value={leaderLeague} onChange={e => setLeaderLeague(e.target.value)} className="border border-gray-300 rounded px-2 py-1">
          <option value="MLB">MLB</option>
          <option value="AL">American League</option>
          <option value="NL">National League</option>
        </select>
      </label>
      
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-bold mb-2">American League</h3>
          <StandingsTable standings={{ AL: standings.AL }} />
        </div>
        <div>
          <h3 className="text-lg font-bold mb-2">National League</h3>
          <StandingsTable standings={{ NL: standings.NL }} />
        </div>
      </div>
      </section>
    </div>
  )
}
