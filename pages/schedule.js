import fs from 'fs'
import path from 'path'
import teams from '../data/teams.json'

export async function getStaticProps() {
  const schedulePath = path.join(process.cwd(), 'data', 'schedule.json')
  const raw = fs.readFileSync(schedulePath, 'utf8')
  const schedule = JSON.parse(raw)

  return {
    props: { schedule }
  }
}

const teamName = (abbr) => {
  const t = teams.find(t => t.id === abbr)
  return t?.name || abbr || 'TBD'
}

const formatScore = (game) => {
  return `${game.road_score}–${game.home_score}`
}

const SchedulePage = ({ schedule }) => {
  const grouped = schedule.reduce((acc, g) => {
    if (!g.date) return acc
    if (!acc[g.date]) acc[g.date] = []
    acc[g.date].push(g)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">1999 Season Schedule</h1>
      {sortedDates.map(date => (
        <div key={date} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{date}</h2>
          <table className="w-full border-collapse text-sm mb-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Road</th>
                <th className="border p-2 text-left">Home</th>
                <th className="border p-2 text-center">Result</th>
              </tr>
            </thead>
            <tbody>
              {grouped[date].map((g, i) => (
                <tr key={i} className="border-t">
                  <td className="border p-2">
                    {g.road ? (
                      <a href={`/teams/${g.road}`} className="text-blue-600 hover:underline">
                        {teamName(g.road)}
                      </a>
                    ) : "TBD"}
                  </td>
                  <td className="border p-2">
                    {g.home ? (
                      <a href={`/teams/${g.home}`} className="text-blue-600 hover:underline">
                        {teamName(g.home)}
                      </a>
                    ) : "TBD"}
                  </td>
                  <td className="border p-2 text-center">
                    {g.played ? (
                      g.game_id ? (
                        <a href={`/boxscores/${g.game_id}`} className="text-green-600 hover:underline">
                          {formatScore(g)}
                        </a>
                      ) : formatScore(g)
                    ) : (
                      <span className="text-gray-500 italic">Scheduled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default SchedulePage