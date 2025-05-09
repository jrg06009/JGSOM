import Link from 'next/link'

export default function StandingsTable({ games, teams }) {
  if (!games || !teams) return <div>Standings data unavailable.</div>

  const standings = calculateStandingsByDivision(games, teams)

  const orderedDivisions = ['East', 'Central', 'West']
  const renderLeague = league => (
    <div className="w-full md:w-1/2 px-2">
      <h2 className="text-xl font-bold mb-2">{league}</h2>
      {orderedDivisions.map(division => {
        const groupKey = `${league} - ${division}`
        const divisionTeams = standings[groupKey]
        if (!divisionTeams) return null

        return (
          <div key={groupKey} className="mb-6 border rounded-md overflow-hidden">
            <h3 className="text-lg font-semibold bg-gray-100 p-2 border-b">{division} Division</h3>
            <table className="w-full border border-collapse border-gray-400">
              <thead>
                <tr>
                  <th className="border border-gray-400 p-2">Team</th>
                  <th className="border border-gray-400 p-2">W</th>
                  <th className="border border-gray-400 p-2">L</th>
                  <th className="border border-gray-400 p-2">PCT</th>
                  <th className="border border-gray-400 p-2">GB</th>
                </tr>
              </thead>
              <tbody>
                {divisionTeams.map(team => (
                  <tr key={team.id}>
                    <td className="border border-gray-400 p-2 text-blue-700">
                      <Link href={`/teams/${team.id}`}>{team.name}</Link>
                    </td>
                    <td className="border border-gray-400 p-2 text-center">{team.W}</td>
                    <td className="border border-gray-400 p-2 text-center">{team.L}</td>
                    <td className="border border-gray-400 p-2 text-center">
                      {team.pct === '1.000' ? '1.000' : team.pct.replace(/^0/, '')}
                    </td>
                    <td className="border border-gray-400 p-2 text-center">{team.GB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {renderLeague('AL')}
      {renderLeague('NL')}
    </div>
  )
}

function calculateStandingsByDivision(games, teams) {
  const standings = {}
  teams.forEach(team => {
    standings[team.id] = { ...team, W: 0, L: 0 }
  })

  games.forEach(game => {
    const { home, away, result } = game
    const [awayScoreStr, homeScoreStr] = result.match(/\d+/g) || []
    const awayScore = parseInt(awayScoreStr)
    const homeScore = parseInt(homeScoreStr)

    if (homeScore > awayScore) {
      standings[home].W++
      standings[away].L++
    } else {
      standings[away].W++
      standings[home].L++
    }
  })

  const grouped = {}
  teams.forEach(team => {
    const league = team.league || 'Unknown League'
    const division = team.division || 'Unknown Division'
    const key = `${league} - ${division}`
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(standings[team.id])
  })

  Object.values(grouped).forEach(division => {
    division.sort((a, b) => b.W - a.W || a.L - b.L)
    const leader = division[0]
    division.forEach(team => {
      const totalGames = team.W + team.L
      team.pct = totalGames === 0 ? '.000' : (team.W / totalGames).toFixed(3)
      if (team.pct === '1.000') team.pct = '1.000'
      team.GB = (((leader.W - team.W) + (team.L - leader.L)) / 2).toFixed(1)
      if (team.GB === '0.0') team.GB = '-'
    })
  })

  return grouped
}
