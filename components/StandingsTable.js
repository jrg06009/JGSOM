import Link from 'next/link'

export default function StandingsTable({ standings, teams, useFullName = false }) {
  // Create a lookup for team ID to team name
  const teamMap = {}
  teams.forEach(team => {
    teamMap[team.id] = team.name
  })

  return (
    <div className="space-y-6">
      {Object.entries(standings).map(([league, divisions]) => (
        <div key={league}>
          <h2 className="text-xl font-bold mt-4">{league}</h2>
          {Object.entries(divisions).map(([division, teams]) => (
            <div key={division}>
              <h3 className="text-lg font-semibold mt-2">{division}</h3>
              <table className="w-full border-collapse border border-gray-400 mt-1">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-1 text-left">Team</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">W</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">L</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">W-L%</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">GB</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.team}>
                      <td className="border border-gray-300 px-2 py-1">
                        <Link href={`/teams/${team.team}`} className="text-blue-600 underline">
                          {useFullName ? teamMap[team.team] || team.team : team.team}
                        </Link>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{team.W}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{team.L}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{team["W-L%"]}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{team.GB !== undefined ? team.GB : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
