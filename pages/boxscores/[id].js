import fs from 'fs'
import path from 'path'
import teams from '../../data/teams.json'
import schedule from '../../data/stats/schedule.json'
import linescores from '../../data/stats/linescores.json'
import Link from 'next/link'

export async function getStaticPaths() {
  const dir = path.join(process.cwd(), 'data/boxscores')
  if (!fs.existsSync(dir)) return { paths: [], fallback: false }
  const files = fs.readdirSync(dir)
  const paths = files.map(file => ({
    params: { id: file.replace('.json', '') }
  }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'data/boxscores', `${params.id}.json`)
  const raw = fs.readFileSync(filePath, 'utf8')
  const boxscore = JSON.parse(raw)
  const linescore = linescores[params.id] || null
  return { props: { boxscore, linescore } }
}

const getTeamName = abbr => {
  const t = teams.find(t => t.id === abbr)
  return t?.name || abbr
}

const getTeamRecordThroughDate = (schedule, team, dateStr) => {
  const games = schedule.filter(g => {
    const gDate = new Date(g.date)
    return g.completed && gDate < new Date(dateStr) &&
      (g.home_team === team || g.away_team === team)
  })

  let W = 0, L = 0
  games.forEach(g => {
    const isHome = g.home_team === team
    const teamScore = isHome ? g.home_score : g.away_score
    const oppScore = isHome ? g.away_score : g.home_score
    if (teamScore > oppScore) W++
    else L++
  })

  return `${W}-${L}`
}

const BoxscorePage = ({ boxscore, linescore }) => {
  if (!boxscore || !boxscore.meta || !boxscore.batting || !boxscore.pitching) {
  return <div className="p-4 text-red-600">Boxscore data missing or incomplete.</div>
}
  const { meta, batting, pitching, positions } = boxscore
  const teamIds = [meta.away, meta.home]

  const getPlayerLink = pid => {
  return pid ? `/players/${pid}` : '#'
}
  
  const groupBattingLines = entries => {
    return entries.map(([name, stats]) => ({
      ...stats,
      Player: name,
      POS: Array.isArray(stats.POS) ? stats.POS.join('-') : (stats.POS || "")
    }))
  }

  const positionMap = {
  '1': 'P',
  '2': 'C',
  '3': '1B',
  '4': '2B',
  '5': '3B',
  '6': 'SS',
  '7': 'LF',
  '8': 'CF',
  '9': 'RF'
};

const getPositionString = (team, player) => {
  const posSet = boxscore.positions?.[team]?.[player];
  if (!posSet) return '';
  const readable = Array.from(posSet)
    .map(p => positionMap[p] || (p === 'DH' ? 'DH' : p))
    .join('-');
  return readable;
};

  const pitchingDisplayMap = {
  "IP": "IP",
  "H allowed": "H",
  "R against": "R",
  "ER": "ER",
  "BB against": "BB",
  "SO against": "SO",
  "HR allowed": "HR"
}

  const renderBatting = team => {
    if (!batting?.[team]) return null
    const lines = groupBattingLines(Object.entries(batting[team]))

    const summaryStats = ["2B", "3B", "HR", "HBP", "IBB", "SH", "SF", "SB", "CS", "GDP", "ERR"]
    const summary = {}
    lines.forEach(p => {
      summaryStats.forEach(stat => {
        if (p[stat]) {
          if (!summary[stat]) summary[stat] = []
          summary[stat].push(p[stat] > 1 ? `${p["Player"]} ${p[stat]}` : p["Player"])
        }
      })
    })

    return (
      <>
        <h3 className="font-semibold mt-4">{getTeamName(team)} Batting</h3>
        <table className="w-full text-sm border border-collapse mb-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1 text-left">Player</th>
              <th className="border p-1 text-center">AB</th>
              <th className="border p-1 text-center">R</th>
              <th className="border p-1 text-center">H</th>
              <th className="border p-1 text-center">RBI</th>
              <th className="border p-1 text-center">BB</th>
              <th className="border p-1 text-center">SO</th>
              <th className="border p-1 text-center">PA</th>
              <th className="border p-1 border-l-2 border-l-black text-center">PO</th>
              <th className="border p-1 text-center">A</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((p, i) => {
              const pa = (p.AB || 0) + (p.BB || 0) + (p.HBP || 0) + (p.SF || 0)
              return (
                <tr key={i}>
                  <td className={`border p-1 ${(!boxscore.games_started?.[team]?.[p["Player"]] || boxscore.games_started[team][p["Player"]] === 0) ? "pl-4" : ""}`}>
                    <Link href={getPlayerLink(p["Player ID"])} className="text-blue-700 underline">
                      {p["Player"]}
                    </Link>
                    {getPositionString(team, p["Player"]) && (
                      <span className="italic"> {getPositionString(team, p["Player"])}</span>
                    )}
                  </td>
                  <td className="border p-1 text-center">{p.AB || 0}</td>
                  <td className="border p-1 text-center">{p.R || 0}</td>
                  <td className="border p-1 text-center">{p.H || 0}</td>
                  <td className="border p-1 text-center">{p.RBI || 0}</td>
                  <td className="border p-1 text-center">{p.BB || 0}</td>
                  <td className="border p-1 text-center">{p.SO || 0}</td>
                  <td className="border p-1 text-center">{pa}</td>
                  <td className="border p-1 border-l-2 border-l-black text-center">{p.PO || 0}</td>
                  <td className="border p-1 text-center">{p.A || 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {Object.keys(summary).length > 0 && (
          <div className="text-sm mt-2 space-y-1">
            {Object.entries(summary)
              .sort((a,b) => summaryStats.indexOf(a[0]) - summaryStats.indexOf(b[0]))
              .map(([stat, players]) => (
                <div key={stat}>
                  <strong>{stat}: </strong>{players.join("; ")}
                </div>
            ))}
          </div>
        )}
      </>
    )
  }

const renderPitching = team => {
  if (!pitching?.[team]) return null

  const summaryStats = ["IBB against", "HBP against", "BK", "WP", "SB against", "CS against", "Pko"]
  const summary = {}
  Object.values(pitching[team]).forEach(p => {
    summaryStats.forEach(stat => {
      if (p[stat]) {
        if (!summary[stat]) summary[stat] = []
        summary[stat].push(p[stat] > 1 ? `${p["Player"]} ${p[stat]}` : p["Player"])
      }
    })
  })

  return (
    <>
      <h3 className="font-semibold mt-4">{getTeamName(team)} Pitching</h3>
      <table className="w-full text-sm border border-collapse mb-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left">Pitcher</th>
            {Object.values(pitchingDisplayMap).map((label, i) => (
              <th key={i} className="border p-1 text-center">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.values(pitching[team]).map((p, i) => (
            <tr key={i}>
              <td className="border p-1">
                <Link href={getPlayerLink(p["Player ID"])} className="text-blue-700 underline">
                  {p["Player"]}
                </Link>
                {["W", "L", "SV"].map(k => p[k] > 0 ? (
                  <span key={k} className="italic">, {k}</span>
                ) : null)}            
              </td>
              {Object.keys(pitchingDisplayMap).map((rawKey, j) => (
                <td key={j} className="border p-1 text-center">
                  {p[rawKey] || 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {Object.keys(summary).length > 0 && (
        <div className="text-sm mt-2 space-y-1">
          {Object.entries(summary).map(([stat, players]) => (
            <div key={stat}>
              <strong>{stat.replace(" against", "")}: </strong>{players.join("; ")}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <div className="flex justify-center items-center gap-16 mb-2">
          {[meta.away, meta.home].map((abbr, i) => {
            const team = teams.find(t => t.id === abbr)
            return (
              <div key={i} className="flex flex-col items-center">
                <img src={team.logo} alt={team.name} className="h-16 mb-1" />
                <Link href={`/teams/${abbr}`} className="text-blue-700 underline font-semibold">
                  {team.name}
                </Link>
                <div className="text-3xl font-bold mt-1">
                  {i === 0 ? parseInt(meta.away_score) : parseInt(meta.home_score)}
                </div>
                <div className="text-xs text-gray-700 mt-1">
                  {getTeamRecordThroughDate(schedule, abbr, meta.date)}
                </div>
              </div>
            )      
          })}
        </div>
        <div className="text-sm text-gray-700 mt-1 mb-4">
          {new Date(meta.date).toLocaleDateString()}
        </div>
        {linescore && (
          (() => {
            const away = linescore[meta.away] || []
            const home = linescore[meta.home] || []

    // Find the last inning index where at least one team has a value
            const lastUsedInning = Math.max(
              ...away.map((val, i) => val && val !== "" ? i : -1),
              ...home.map((val, i) => val && val !== "" ? i : -1)
            ) + 1 // +1 to include that inning
            const trimmedAway = away.slice(0, lastUsedInning)
            const trimmedHome = home.slice(0, lastUsedInning)
            const paddedHome = trimmedHome.map((val, i) => {
              const isLast = i === lastUsedInning - 1
              const awayHasScore = trimmedAway[i] && trimmedAway[i] !== ""
              return (val && val !== "") ? val : (isLast && awayHasScore ? "X" : "")
            })

            const sumInning = arr =>
              arr.reduce((sum, val) => sum + (parseInt(val) || 0), 0)

            const getHits = team => {
              return Object.values(boxscore.batting?.[team] || {}).reduce(
                (sum, player) => sum + (player.H || 0), 0
              )
            }

            const getErrors = team => {
              return Object.values(boxscore.batting?.[team] || {}).reduce(
                (sum, player) => sum + (player.ERR || 0), 0
              )
            }

            const R_away = sumInning(trimmedAway)
            const R_home = sumInning(paddedHome)
            const H_away = getHits(meta.away)
            const H_home = getHits(meta.home)
            const E_away = getErrors(meta.away)
            const E_home = getErrors(meta.home)

            return (
              <>
                <table className="mx-auto mb-4 text-sm border border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-1 text-center"></th>
                        {trimmedAway.map((_, i) => (
                          <th key={i} className="border p-1 text-center">{i + 1}</th>
                        ))}                        
                        <th className="border p-1 text-center font-semibold">R</th>
                        <th className="border p-1 text-center font-semibold">H</th>
                        <th className="border p-1 text-center font-semibold">E</th>                 
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-1 text-right font-semibold">{getTeamName(meta.away)}</td>
                      {trimmedAway.map((val, i) => (
                        <td key={i} className="border p-1 text-center">{val}</td>
                      ))}
                      <td className="border p-1 text-center font-semibold">{R_away}</td>
                      <td className="border p-1 text-center font-semibold">{H_away}</td>
                      <td className="border p-1 text-center font-semibold">{E_away}</td>
                    </tr>
                    <tr>
                      <td className="border p-1 text-right font-semibold">{getTeamName(meta.home)}</td>
                      {paddedHome.map((val, i) => (
                        <td key={i} className="border p-1 text-center">{val}</td>
                      ))}                      
                      <td className="border p-1 text-center font-semibold">{R_home}</td>
                      <td className="border p-1 text-center font-semibold">{H_home}</td>
                      <td className="border p-1 text-center font-semibold">{E_home}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-2 text-sm font-medium">
                  {["W", "L", "SV"].map((label) => {
                    const allPitchers = [...Object.entries(pitching[meta.away] || {}), ...Object.entries(pitching[meta.home] || {})]
                    const match = allPitchers.find(([_, stats]) => stats[label] > 0)
                    if (!match) return null
                    const [_, stats] = match
                    return (
                      <span key={label} className="mr-4">
                        {label}: <Link href={`/players/${stats["Player ID"]}`} className="text-blue-700 underline">{stats["Player"]}</Link>
                      </span>
                    )
                  })}
                </div>
              </>
            )
          })()
        )}
      </div>

      {teamIds.map(t => (
        <div key={t} className="mb-8">
          {renderBatting(t)}
          {renderPitching(t)}
        </div>
      ))}
    </div>
  )
}

export default BoxscorePage
