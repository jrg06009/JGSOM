import Link from 'next/link'

export default function StandingsTable({ standings, teams, useFullName = false, hideLeagueHeaders = false, enhanced = false }) {
  // Create a lookup for team ID to team name
  const teamMap = {}
  const teamInfoMap = {}
  if (Array.isArray(teams)) teams.forEach(team => {
    teamMap[team.id] = team.name
    teamInfoMap[team.id] = {
      logo: team.logo || `/logos/${team.id}.png`,
      color: team.color || '#ccc'
    }
  })

  return (
    <div className="space-y-6">
      {Object.entries(standings).map(([league, divisions]) => (
        <div key={league}>
          {!hideLeagueHeaders && (
            <h2 className="text-xl font-bold mt-4">
              {league === "AL" ? "American League" : league === "NL" ? "National League" : league}
            </h2>
          )}

          {Object.entries(divisions).map(([division, divisionTeams]) => (
            <div key={division} className="w-full sm:w-[300px] mb-4">
              <h3 className="text-lg font-semibold mt-2">{division}</h3>
              <table className="w-full border-collapse border border-gray-400 mt-1">
                <thead>
                  <tr className="bg-gray-200">
                    {enhanced && <th className="w-1"></th>}
                    <th className="border border-gray-400 px-2 py-1 text-left">Team</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">W</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">L</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">W-L%</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">GB</th>
                  </tr>
                </thead>
                <tbody>
                  {divisionTeams.map((team) => (
                    <tr key={team.id} className="border-t border-gray-300">
                      {enhanced && (
                        <td
                          className="w-1"
                          style={{ backgroundColor: teamInfoMap[team.id]?.color || '#eee' }}
                        ></td>
                      )}
                      <td className="text-left p-1 flex items-center space-x-2">
                        {enhanced && (
                          <img
                            src={teamInfoMap[team.id]?.logo}
                            alt={team.id}
                            className="w-5 h-5"
                          />
                        )}
                        <Link href={`/teams/${team.id}`} className="hover:underline">
                          {useFullName ? teamMap[team.id] || team.id : team.id}
                        </Link>
                      </td>
                      <td className="text-center p-1">{team.w}</td>
                      <td className="text-center p-1">{team.l}</td>
                      <td className="text-center p-1">{team.gb}</td>
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
}
