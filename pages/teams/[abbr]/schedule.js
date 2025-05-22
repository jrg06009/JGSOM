import schedule from '../../../data/stats/schedule.json'
import teams from '../../../data/teams.json'
import Link from 'next/link'

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

export async function getStaticPaths() {
  const paths = teams.map(team => ({
    params: { abbr: team.id }
  }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const abbr = params.abbr
  const team = teamMap[abbr] || null
  const games = schedule.filter(
    g => g.home_team === abbr || g.away_team === abbr
  )

  return {
    props: {
      abbr,
      team,
      games
    }
  }
}

const TeamSchedule = ({ abbr, team, games }) => {
  if (!team) return <div className="p-4 text-red-600">Team not found.</div>

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
            const isHome = game.home_team === abbr
            const opponent = isHome ? game.away_team : game.home_team
            const teamScore = isHome ? game.home_score : game.away_score
            const oppScore = isHome ? game.away_score : game.home_score
            const result = game.completed
              ? `${teamScore}-${oppScore} (${teamScore > oppScore ? 'W' : 'L'})`
              : '—'

            return (
              <tr key={i}>
                <td className="border p-1 text-center">{game.date}</td>
                <td className="border p-1 text-center">{isHome ? 'vs' : '@'} {opponent}</td>
                <td className="border p-1 text-center">{result}</td>
                <td className="border p-1 text-center">
                  {game.completed ? (
                    <Link
                      href={`/boxscores/${game.id}`}
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
