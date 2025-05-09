import Link from 'next/link'

export default function StandingsTable({ games, teams }) {
  const standings = calculateStandingsByDivision(games, teams)

  return (
    <div>
      {Object.entries(standings).map(([group, teams]) => (
        <div key={group} className="my-6">
          <h3 className="text-lg font-semibold mb-2">{group}</h3>
          <table className="w-full border border-gray-400">
            <thead>
              <tr>
                <th className="border border-gray-400 p-2">Team</th>
                <th className="border border-gray-400 p-2">W</th>
                <th className="border border-gray-400 p-2">L</th>
                <th className="border border-gray-400 p-2">GB</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.id}>
                  <td className="border border-gray-400 p-2 text-blue-700">
                    <Link href={`/teams/${team.id}`}>{team.name}</Link>
                  </td>
                  <td className="border border-gray-400 p-2 text-center">{team.W}</td>
                  <td className="border border-gray-400 p-2 text-center">{team.L}</td>
                  <td className="border border-gray-400 p-2 text-center">{team.GB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function calculateStandingsByDivision(games, teams) {
  const standings = {}
  teams.forEach(team => {
    standings[team.id] = { ...team, W: 0, L: 0 }
  })

  games.forEach(game => {
    const { homeTeam, awayTeam, homeScore, awayScore } = game
    if (homeScore > awayScore) {
      standings[homeTeam].W++
      standings[awayTeam].L++
    } else {
      standings[awayTeam].W++
      standings[homeTeam].L++
    }
  })

  const grouped = {}
  teams.forEach(team => {
    const key = `${team.league} - ${team.division}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(standings[team.id])
  })

  Object.values(grouped).forEach(division => {
    division.sort((a, b) => b.W - a.W || a.L - b.L)
    const leader = division[0]
    division.forEach(team => {
      team.GB = (((leader.W - team.W) + (team.L - leader.L)) / 2).toFixed(1)
      if (team.GB === '0.0') team.GB = '-'
    })
  })

  return grouped
}
