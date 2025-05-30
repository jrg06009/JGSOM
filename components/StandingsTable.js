import Link from 'next/link'
import { getTeamResults, calculateStreakAndLast10 } from '../lib/teamStreakUtils'

export default function StandingsTable({ standings, teams, schedule = [], useFullName = false, hideLeagueHeaders = false, enhanced = false }) {
  // Create a lookup for team ID to team name
  const teamMap = {}
  const teamInfoMap = {}
  const teamExtras = {}
  if (Array.isArray(teams)) teams.forEach(team => {
    teamMap[team.id] = team.name
    teamInfoMap[team.id] = {
      logo: team.logo || `/logos/${team.id}.png`,
      color: team.color || '#ccc'
    }
    if (enhanced) {
      const results = getTeamResults(schedule, team.id)
      teamExtras[team.id] = calculateStreakAndLast10(results)
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
                    {enhanced && <th className="w-2"></th>}
                    <th className="border border-gray-400 px-2 py-1 text-left">Team</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">W</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">L</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">W-L%</th>
                    <th className="border border-gray-400 px-2 py-1 text-right">GB</th>
                    {enhanced && (
                      <>
                        <th className="border border-gray-400 px-2 py-1 text-right">Streak</th>
                        <th className="border border-gray-400 px-2 py-1 text-right">Last 10</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {divisionTeams.map((team) => (
                    const extras = teamExtras[team.team] || {}
                    const streak = extras.streak || '—'
                    const last10 = extras.last10 || '—'
                    const streakClass =
                      streak.startsWith('W') ? 'text-green-600 font-semibold' :
                      streak.startsWith('L') ? 'text-red-600 font-semibold' :
                      ''

                    return (                 
                    <tr key={team.team} className="border-t border-gray-300">
                      {enhanced && (
                        <td
                          className="w-2 h-5"
                          style={{ backgroundColor: teamInfoMap[team.team]?.color || '#eee',
                                    minWidth: '8px'
                                }}
                        ></td>
                      )}
                      <td className="text-left p-1 flex items-center space-x-2">
                        {enhanced && (
                          <img
                            src={teamInfoMap[team.team]?.logo}
                            alt={team.team}
                            className="w-5 h-5"
                          />
                        )}
                        <Link href={`/teams/${team.team}`} className="text-blue-600 underline">
                          {useFullName ? teamMap[team.team] || team.team : team.team}
                        </Link>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{team.W}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{team.L}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{team["W-L%"]}</td>
                      <td className="border border-gray-300 px-2 py-1 text-right">{team.GB !== undefined ? team.GB : ""}</td>
                      {enhanced && (
                        <>
                          <td className={`border border-gray-300 px-2 py-1 text-right ${streakClass}`}>
                            {streak}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-right">
                            {last10}
                          </td>
                        </>
                      )}                          
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
