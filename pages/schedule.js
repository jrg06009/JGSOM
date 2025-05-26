import fs from 'fs'
import path from 'path'
import teams from '../data/teams.json'
const boxscoresDir = path.join(process.cwd(), 'data/boxscores');

export async function getStaticProps() {
  const schedulePath = path.join(process.cwd(), 'data', 'stats', 'schedule.json')
  const raw = fs.readFileSync(schedulePath, 'utf8')
  const schedule = JSON.parse(raw)
  const boxscoreFiles = fs.existsSync(boxscoresDir) ? fs.readdirSync(boxscoresDir) : []
  const wlMap = {}
  for (const file of boxscoreFiles) {
    const gameId = file.replace('.json', '')
    const boxscorePath = path.join(boxscoresDir, file)
    const rawBox = fs.readFileSync(boxscorePath, 'utf8')
    const box = JSON.parse(rawBox)
    const allPitchers = [
      ...Object.values(box.pitching?.[box.meta?.away] || {}),
      ...Object.values(box.pitching?.[box.meta?.home] || {})
    ]
    const win = allPitchers.find(p => p.W > 0)
    const loss = allPitchers.find(p => p.L > 0)
    const save = allPitchers.find(p => p.SV > 0)
    wlMap[gameId] = {
      winner: win?.Player || "",
      loser: loss?.Player || "",
      save: save?.Player || "",
    }
      // Load pitching game log and build to-date W/L/S lookup
  const pitchingLogPath = path.join(process.cwd(), 'data', 'stats', 'pitching_log.json')
  const pitchingRaw = fs.readFileSync(pitchingLogPath, 'utf8')
  const pitchingLog = JSON.parse(pitchingRaw)

  // Build cumulative stats by player
  const pitcherStatsMap = {}
  for (const game of pitchingLog) {
    const pid = game["Player ID"]
    const gameId = game["Game ID"]
    const date = gameId?.split('_')[0]
    const w = game.W || 0
    const l = game.L || 0
    const sv = game.SV || 0
    const player = game.Player
    if (!pid || !gameId || !date || !player) continue

    if (!pitcherStatsMap[pid]) pitcherStatsMap[pid] = []
    pitcherStatsMap[pid].push({ gameId, date, player, W: w, L: l, SV: sv })
  }

  // Create a lookup for (gameId, player) → cumulative totals (including game day)
  const logLookup = {}
  for (const pid in pitcherStatsMap) {
    const games = pitcherStatsMap[pid].sort((a, b) => a.date.localeCompare(b.date))
    let w = 0, l = 0, sv = 0
    for (const g of games) {
      w += g.W
      l += g.L
      sv += g.SV
      logLookup[`${g.gameId}_${g.player}`] = { W: w, L: l, SV: sv }
    }
  }

  // Merge W/L/S into schedule objects
  for (const g of schedule) {
    if (g.completed && g.id && wlMap[g.id]) {
      const win = wlMap[g.id]?.winner
      const loss = wlMap[g.id]?.loser
      const save = wlMap[g.id]?.save

      g.winner = win
      g.winnerId = wlMap[g.id]?.winnerId || ""
      g.loser = loss
      g.loserId = wlMap[g.id]?.loserId || ""
      g.save = save
      g.saveId = wlMap[g.id]?.saveId || ""
      g.winnerStats = win ? logLookup[`${g.id}_${win}`] : null
      g.loserStats = loss ? logLookup[`${g.id}_${loss}`] : null
      g.saveStats = save ? logLookup[`${g.id}_${save}`] : null
    }
  }
}


  // Add W/L/S to each completed game
  for (const g of schedule) {
    if (g.completed && g.id && wlMap[g.id]) {
      Object.assign(g, wlMap[g.id])
    }
  }

  return { props: { schedule } }
}

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

const teamName = (abbr) => teamMap[abbr]?.name || abbr || 'TBD'
const getTeamColor = (abbr) => teamMap[abbr]?.color || "#000"


const formatScore = (game) => {
  const score = `${game.away_score}–${game.home_score}`
  const winner = game.away_score > game.home_score ? game.away_team : game.home_team
  const color = getTeamColor(winner)

  return (
    <>
      <strong> <span style={{ color, fontWeight: 600 }}>{score}, {winner}</span></strong>
    </>
  )
}



const SchedulePage = ({ schedule }) => {
  const grouped = schedule.reduce((acc, g) => {
    if (!g.date) return acc
    if (!acc[g.date]) acc[g.date] = []
    acc[g.date].push(g)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">1999 Season Schedule</h1>
      {sortedDates.map(date => (
        <div key={date} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{date}</h2>
          <table className="w-full border-collapse text-sm mb-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Road</th>
                <th className="border p-2 text-left">Home</th>
                <th className="border p-2 text-center">Result</th>
                <th className="border p-2 text-center">Win</th>
                <th className="border p-2 text-center">Loss</th>
                <th className="border p-2 text-center">Save</th>
              </tr>
            </thead>
            <tbody>
              {grouped[date].map((g, i) => (
                <tr key={i} className="border-t">
                  <td className="border p-2">
                    {g.away_team ? (
                      <a href={`/teams/${g.away_team}`} className="text-blue-600 hover:underline">
                        {teamName(g.away_team)}
                      </a>
                    ) : "TBD"}
                  </td>
                  <td className="border p-2">
                    {g.home_team ? (
                      <a href={`/teams/${g.home_team}`} className="text-blue-600 hover:underline">
                        {teamName(g.home_team)}
                      </a>
                    ) : "TBD"}
                  </td>
                  <td className="border p-2 text-center">
                    {g.completed ? (
                      g.id ? (
                        <a href={`/boxscores/${g.id}`} className="text-green-600 hover:underline" title={g.simDate ? `Simulated on ${g.simDate}` : ""}>
                          {formatScore(g)}
                        </a>
                      ) : (
                        <span title={g.simDate ? `Simulated on ${g.simDate}` : ""}>
                          {formatScore(g)}
                        </span>
                      )                
                    ) : (
                      <span className="text-gray-500 italic">Scheduled</span>
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {g.winner && (
                      <>
                        {g.winner}
                        {g.winnerStats && ` (${g.winnerStats.W}-${g.winnerStats.L})`}
                      </>
                    )}
                  </td>   
                  <td className="border p-2 text-center">
                    {g.loser && (
                      <>
                        {g.loser}
                        {g.loserStats && ` (${g.loserStats.W}-${g.loserStats.L})`}
                      </>    
                    )}
                  </td>
                  <td className="border p-2 text-center">
                    {g.save && (
                      <>
                        {g.save}
                        {g.saveStats && ` (${g.saveStats.SV})`}
                      </>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default SchedulePage
