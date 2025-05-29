import teams from '../data/teams.json'
import StandingsTable from '../components/StandingsTable'

export async function getStaticProps() {
  const standings = await import('../data/stats/standings.json').then(mod => mod.default || mod)
  return { props: { standings, teams } }
}

export default function StandingsPage({ standings, teams }) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">1999 Standings</h1>
      <div className="space-y-10">
        {['AL', 'NL'].map(league => (
          <div key={league}>
            <h2 className="text-xl font-semibold mb-2">
              {league === 'AL' ? 'American League' : 'National League'}
            </h2>
            <div className="flex flex-wrap gap-6">
              {standings[league].map((division, idx) => (
                <div key={`${league}-${idx}`} className="w-fit">
                  <StandingsTable
                    standings={{ [league]: [division] }}
                    teams={teams}
                    hideLeagueHeaders={true}
                    useFullName={true}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
