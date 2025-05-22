import { useRouter } from 'next/router'
import schedule from '../../../data/stats/schedule.json'
import teams from '../../../data/teams.json'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'

// Convert YYYY-MM-DD to "Monday, April 5th"
function formatPrettyDate(dateStr) {
  const date = new Date(dateStr)
  const day = date.getDate()
  const suffix = [11, 12, 13].includes(day) ? 'th' : ['st', 'nd', 'rd'][day % 10 - 1] || 'th'
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).replace(`${day}`, `${day}${suffix}`)
}

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

export async function getStaticPaths() {
  const paths = teams.map(team => ({
    params: { abbr: team.id }
  }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const abbr = params.abbr
  const team = teamMap[abbr]
  const games = schedule.filter(g => g.home_team === abbr || g.away_team === abbr)

  // Load boxscores if available
  const boxscoresDir = path.join(process.cwd(), 'data', 'boxscores')
  const boxscores = {}

  for (const game of games) {
    try {
      const filePath = path.join(boxscoresDir, `${game.id}.json`)
      const contents = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(contents)

      // Extract W/L/S pitcher from pitching data
      const pitching = data.pitching || {}
      for (const teamID of Object.keys(pitching)) {
        for (const player of Object.values(pitching[teamID])) {
          if (player.W) boxscores[game.id] = { ...boxscores[game.id], W: player.Player }
          if (player.L) boxscores[game.id] = { ...boxscores[game.id], L: player.Player }
          if (player.SV) boxscores[game.id] = { ...boxscores[game.id], SV: player.Player }
        }
      }
    } catch {
      // File not found or malformed — skip
    }
  }

  return {
    props: {
      abbr,
      team,
      games,
      boxscores
    }
  }
}

const TeamSchedule = ({ abbr, team, games, boxscores }) => {
  let wins = 0
  let losses = 0

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <img src={`/logos/${abbr}.png`} className="w-20 h-20 mr-4" alt={`${team.name} logo`} />
        <h1 className="text-3xl font-bold">{team.name} Schedule</h1>
      </div>
      <table className="w-full text-sm border border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-center">Date</th>
            <th className="border p-1 text-center">Opponent</th>
            <th className="border p-1 text-center">Result</th>
            <th className="border p-1 text-center">W-L</th>
            <th className="border p-1 text-center">Win</th>
            <th className="border p-1 text-center">Loss</th>
            <th className="border p-1 text-center">Save</th>
            <th className="border p-1 text-center">Boxscore</th>
            <th className="border p-1 text-center">Sim Date</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            let wins = 0
            let losses = 0
            let lastMonth = ''

            return games.map((game, i) => {
              const isHome = game.home_team === abbr
              const opponentAbbr = isHome ? game.away_team : game.home_team
              const teamScore = isHome ? game.home_score : game.away_score
              const oppScore = isHome ? game.away_score : game.home_score
              const isCompleted = game.completed

              const dateObj = new Date(game.date)
              const month = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' })
              const formattedDate = formatPrettyDate(game.date)

              const bs = boxscores[game.id] || {}

              let result = '—'
              let resultClass = ''
              if (isCompleted) {
                if (teamScore > oppScore) {
                  wins++
                  resultClass = 'text-green-600 font-bold'
                } else {
                  losses++
                  resultClass = 'text-red-600 font-bold'
                }
                result = `${teamScore}-${oppScore} (${teamScore > oppScore ? 'W' : 'L'})`
              }

              const monthRow = month !== lastMonth ? (
                <tr key={`month-${month}`}>
                  <td colSpan={9} className="bg-gray-200 text-center font-semibold p-2">{month}</td>
                </tr>
              ) : null

              lastMonth = month

              return (
                <>
                  {monthRow}
                  <tr key={i}>
                    <td className="border p-1 text-center">{formattedDate}</td>
                    <td className="border p-1 text-center flex items-center justify-center gap-2">
                      <img src={`/logos/${opponentAbbr}.png`} alt={opponentAbbr} className="w-6 h-6" />
                      {isHome ? 'vs' : '@'} {opponentAbbr}
                    </td>
                    <td className={`border p-1 text-center ${resultClass}`}>{result}</td>
                    <td className="border p-1 text-center">{wins}-{losses}</td>
                    <td className="border p-1 text-center">{bs.W || '—'}</td>
                    <td className="border p-1 text-center">{bs.L || '—'}</td>
                    <td className="border p-1 text-center">{bs.SV || '—'}</td>
                    <td className="border p-1 text-center">
                      {game.completed ? (
                        <Link href={`/boxscores/${game.id}`} className="text-blue-600 underline hover:text-blue-800">
                          View
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="border p-1 text-center">{game.simDate || '—'}</td>
                  </tr>
                </>
              )
            })
          })()}
        </tbody>
      </table>
    </div>
  )
}

export default TeamSchedule
