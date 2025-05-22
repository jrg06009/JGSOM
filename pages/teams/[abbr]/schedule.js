import { useRouter } from 'next/router'
import schedule from '../../../data/schedule.json'
import teams from '../../../data/teams.json'
import Link from 'next/link'

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

const TeamSchedule = () => {
  const router = useRouter()
  const { abbr } = router.query

  if (!abbr) return <div className="p-4">Loading...</div>

  const team = teamMap[abbr]
  if (!team) return <div className="p-4 text-red-600">Team not found.</div>

  const games = schedule.filter(g => g.home_team === abbr || g.away_team === abbr)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{team.name} Schedule</h1>
      <table className="w-full text-sm border border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-center">Date</th>
            <th className="border p-1 text-center">Opponent</th>
            <th className="border p-1 text-center">Result</th>
            <th className="border p-1 text-center">Boxscore</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game, i) => {
            const isHome = game.home === abbr
            const opponent = isHome ? game.away_team : game.home_team
            const teamScore = isHome ? game.home_Score : game.away_Score
            const oppScore = isHome ? game.away_Score : game.home_Score

            const result = teamScore != null && oppScore != null
              ? `${teamScore}-${oppScore} (${teamScore > oppScore ? 'W' : 'L'})`
              : '—'

            return (
              <tr key={i}>
                <td className="border p-1 text-center">{game.date}</td>
                <td className="border p-1 text-center">{opponent}</td>
                <td className="border p-1 text-center">{result}</td>
                <td className="border p-1 text-center">
                  {game.gameID ? (
                    <Link
                      href={`/boxscores/${game.gameID}`}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      View
                    </Link>
                  ) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default TeamSchedule
