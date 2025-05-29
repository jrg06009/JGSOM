import fs from 'fs'
import path from 'path'
import StandingsTable from '../components/StandingsTable'
import teams from '../data/teams.json'

export async function getStaticProps() {
  const dataPath = path.join(process.cwd(), 'data', 'stats', 'standings.json')
  const raw = fs.readFileSync(dataPath, 'utf8')
  const standings = JSON.parse(raw)

  return {
    props: {
      standings,
      teams
    }
  }
}

export default function StandingsPage({ standings, teams }) {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">1999 Full Season Standings</h1>

      {['AL', 'NL'].map((league) => (
        <div key={league} className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">
            {league === "AL" ? "American League" : "National League"}
          </h2>
          <div className="flex flex-wrap gap-6">
            {Object.entries(standings[league]).map(([division, teamsData]) => (
              <div key={`${league}-${division}`} className="w-fit">
                <StandingsTable
                  standings={{ [league]: { [division]: teamsData } }}
                  teams={teams}
                  useFullName={true}
                  hideLeagueHeaders={true}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
