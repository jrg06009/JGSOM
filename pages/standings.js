import fs from 'fs'
import path from 'path'
import teams from '../data/teams.json'

export async function getStaticProps() {
  const standingsPath = path.join(process.cwd(), 'data', 'standings.json')
  const raw = fs.readFileSync(standingsPath, 'utf8')
  const standings = JSON.parse(raw)

  return {
    props: { standings }
  }
}

export default function StandingsPage({ standings }) {
  const leagues = {
    AL: standings.filter(s => s.league === 'AL'),
    NL: standings.filter(s => s.league === 'NL')
  }

  const getTeamName = (id) => {
    const t = teams.find(t => t.id === id)
    return t?.name || id
  }

  const renderDivision = (division) => (
    <div key={division.division} className="mb-6">
      <h3 className="font-bold text-lg mb-1">{division.division}</h3>
      <table className="w-full text-sm border border-collapse mb-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Team</th>
            <th className="border p-2">W</th>
            <th className="border p-2">L</th>
            <th className="border p-2">Pct</th>
            <th className="border p-2">GB</th>
          </tr>
        </thead>
        <tbody>
          {division.teams.map((team) => (
            <tr key={team.id} className="border-t">
              <td className="border p-2">
                <a href={`/teams/${team.id}`} className="text-blue-600 hover:underline">
                  {getTeamName(team.id)}
                </a>
              </td>
              <td className="border p-2 text-center">{team.W}</td>
              <td className="border p-2 text-center">{team.L}</td>
              <td className="border p-2 text-center">{team.pct}</td>
              <td className="border p-2 text-center">{team.GB}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Standings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['AL', 'NL'].map(league => (
          <div key={league}>
            <h2 className="text-xl font-bold mb-2">{league} League</h2>
            {leagues[league].map(renderDivision)}
          </div>
        ))}
      </div>
    </div>
  )
}
