import fs from 'fs'
import path from 'path'
import StandingsTable from '../components/StandingsTable'
import teams from '../data/teams.json'

export async function getStaticProps() {
  const standingsPath = path.join(process.cwd(), 'data', 'stats', 'standings.json')
  const standings = JSON.parse(fs.readFileSync(standingsPath, 'utf8'))

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
      <h1 className="text-2xl font-bold mb-6">Standings</h1>
      <StandingsTable standings={standings} teams={teams} useFullName={true} />
    </div>
  )
}
