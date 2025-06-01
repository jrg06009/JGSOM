import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { useState } from 'react'
import StandingsTable from '../components/StandingsTable'
import { getQualificationThresholds } from '../components/getQualificationThresholds'
import { getTeamToLeagueMap } from '../lib/teamUtils'
import playerPhotos from '../data/player_photos.json'

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
  const boxscoreDir = path.join(process.cwd(), 'data', 'boxscores')
  const standings = safeLoad(path.join(dataDir, 'standings.json'))
  const schedule = safeLoad(path.join(dataDir, 'schedule.json'))
  const batting = safeLoad(path.join(dataDir, 'batting.json'))
  const pitching = safeLoad(path.join(dataDir, 'pitching.json'))
  const teams = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'teams.json'), 'utf8'))
  const teamToLeague = getTeamToLeagueMap(teams)
  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
  const completedGames = schedule
    .filter(g => g.completed && g['simDate'])
    .sort((a, b) => new Date(b['simDate']) - new Date(a['simDate']))
    .slice(0, 3)
  const recentGames = completedGames.map(game => {
    const fileName = `${game.id}.json`
    const filePath = path.join(boxscoreDir, fileName)
    if (!fs.existsSync(filePath)) return null
    const box = JSON.parse(fs.readFileSync(filePath, 'utf8')) 
    const home_team = box.meta.home_team || box.meta.home
    const away_team = box.meta.away_team || box.meta.away
    const home_score = box.meta.home_score
    const away_score = box.meta.away_score
    const date = box.meta.date
    // ✅ Safety check
    if (!home_team || !away_team) return null
    let wp = null, lp = null, sv = null
    for (const team of [box.pitching[home_team], box.pitching[away_team]]) {
      if (!team) continue
      for (const player of Object.values(team)) {
        if (player.W) wp = player.Player
        if (player.L) lp = player.Player
        if (player.SV) sv = player.Player
      }
    }   
    return {
      game_id: game.id,
      date: game['simDate'],
      home_team,
      away_team,
      home_score: home_score !== undefined ? Math.round(Number(home_score)) : 0,
      away_score: away_score !== undefined ? Math.round(Number(away_score)) : 0,
      wp,
      lp,
      sv,
      simDate: game.simDate,
      scheduledDate: date,
      homeLogo: teamMap[home_team]?.logo || '',
      awayLogo: teamMap[away_team]?.logo || ''
    }
  }).filter(Boolean)
  
  const upcomingGames = schedule
    .filter(g => !g.completed && g.simDate === "")
    .slice(0, 3)
    .map(game => ({
      game_id: game.id,
      scheduledDate: game.date,
      home_team: game.home_team,
      away_team: game.away_team,
      homeLogo: teamMap[game.home_team]?.logo || '',
      awayLogo: teamMap[game.away_team]?.logo || ''
    }))
  
  const latestDate = completedGames.length > 0 ? new Date(completedGames[0]['simDate']) : null
  const latestDateFormatted = latestDate
    ? latestDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  return {
    props: {
      standings,
      schedule,
      batting,
      pitching,
      teams,
      recentGames,
      upcomingGames,
      latestDateFormatted,
      teamToLeague,
    },
  }
}

function getLeaders(data, key, top = 5) {
  const filtered = data.filter(p => parseFloat(p[key]) > 0)
  const sorted = filtered.sort((a, b) => parseFloat(b[key]) - parseFloat(a[key]))
  return sorted.slice(0, top).map(p => ({ ...p, id: p["Player ID"] }))
}

function LeaderList({ title, players, statKey }) {
  const topPlayer = players[0]
  const playerID = topPlayer?.id?.toLowerCase()
  const teamAbbr = topPlayer?.team?.toUpperCase()
  const photoUrl = playerPhotos[playerID]?.[teamAbbr] || null

  console.log("ID:", playerID)
  console.log("Team:", teamAbbr)
  console.log("Photo Entry:", photoEntry)
  console.log("Photo URL:", photoUrl)
  return (
    <div className="border rounded-xl p-3 bg-white shadow w-fit">
      <h3 className="font-bold mb-2 text-lg">{title}</h3>
      {photoUrl && (
        <img
          src={photoUrl}
          alt={topPlayer?.Player}
          className="w-20 h-20 object-cover rounded-full mx-auto mb-2"
        />
      )}
      <table className="text-sm">
        <tbody>
          {players.map((p, i) => (
            <tr key={i}>
              <td className="pr-2 whitespace-no wrap align-top">
                <Link href={`/players/${p.id}`} className="text-blue-600 hover:underline">{p.Player}</Link>
              </td>
              <td className="text-right text-xs font-bold text-gray-700 whitespace-nowrap">
                {p.team} &nbsp; 
                <span className="text-sm font-normal text-black">{p[statKey]}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Home({ standings, batting, pitching, recentGames, latestDateFormatted, teamToLeague, upcomingGames }) {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Most Recent Games</h3>
            {recentGames.map((game, idx) => (
              <div key={idx} className="border rounded-xl p-4 bg-white shadow mb-3">
                <div className="flex justify-between items-center space-x-2 mb-1 font-semibold">
                  <div className="flex items-center space-x-2">
                    <img src={game.awayLogo} alt={game.away_team} className="h-8 w-8 object-contain" />
                    <span>{game.away_team} {game.away_score}</span>
                    <span>at</span>
                    <span>{game.home_team} {game.home_score}</span>
                    <img src={game.homeLogo} alt={game.home_team} className="h-8 w-8 object-contain" />
                  </div>  
                  <div className="text-sm text-right text-gray-600 whitespace-nowrap ml-4">
                  Calendar Date: {new Date(game.scheduledDate).toLocaleDateString('en-US')} <br />
                  Played On: {new Date(game.simDate).toLocaleDateString('en-US')}
                  </div>
                </div>
                <div className="text-sm mb-1">
                  W: {game.wp || '—'}, L: {game.lp || '—'}{game.sv ? `, SV: ${game.sv}` : ''}
                </div>
                <Link href={`/boxscores/${game.game_id}`} className="text-blue-600 hover:underline text-sm">View Boxscore</Link>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Upcoming Games</h3>
            {upcomingGames.map((game, idx) => (
              <div key={idx} className="border rounded-xl p-4 bg-white shadow mb-3">
                <div className="flex items-center space-x-2 font-semibold text-sm">
                  <img src={game.awayLogo} alt={game.away_team} className="h-8 w-8 object-contain" />
                  <span>{game.away_team}</span>
                  <span>at</span>
                  <span>{game.home_team}</span>
                  <img src={game.homeLogo} alt={game.home_team} className="h-8 w-8 object-contain" />
                  <div className="text-sm text-gray-600">
                    Calendar Date: {new Date(game.scheduledDate).toLocaleDateString('en-US')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Stat Leaders</h2>
        <select value={leaderLeague} onChange={e => setLeaderLeague(e.target.value)} className="border border-gray-300 rounded px-2 py-1">
          <option value="MLB">MLB</option>
          <option value="AL">American League</option>
          <option value="NL">National League</option>
        </select>
        <div className="flex flex-wrap md:flex-nowrap gap-4">
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
        <div className="flex flex-wrap gap-4">
          {['AL', 'NL'].map((league) => (
            <div key={league} className="mb-6">
              <h3 className="text-lg font-bold mb-2">
                {league === 'AL' ? 'American League' : 'National League'}
              </h3>
              <div className="flex flex-wrap gap-4">
                {Object.entries(standings[league]).map(([divisionName, teams], idx) => (
                  <div key={idx} className="min-w-[220px] flex-1">
                    <StandingsTable
                      standings={{ [league]: { [divisionName]: teams } }}
                      hideLeagueHeaders
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
