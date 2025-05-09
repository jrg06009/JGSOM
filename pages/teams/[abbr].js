import fs from 'fs'
import path from 'path'

export async function getStaticPaths() {
  const files = fs.readdirSync(path.join(process.cwd(), 'data/stats'))
  const paths = files.map(file => ({
    params: { abbr: file.replace('.json', '') }
  }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const statsPath = path.join(process.cwd(), 'data/stats', `${params.abbr}.json`)
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'))

  const teams = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'teams.json'), 'utf8'))
  const team = teams.find(t => t.id === params.abbr) || null

  return {
    props: {
      abbr: params.abbr,
      stats,
      team
    }
  }
}

export default function TeamPage({ abbr, stats, team }) {
  const renderTable = (title, data) => {
    if (!data || data.length === 0) return null
    const columns = Object.keys(data[0])

    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <div className="overflow-auto border border-gray-400 rounded">
          <table className="table-auto border-collapse w-full text-sm">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col} className="border border-gray-400 p-2 bg-gray-100 text-left">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col} className="border border-gray-300 p-2 text-center">
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {team ? (
        <>
          <div className="flex items-center mb-6">
            <img
              src={team.logo}
              alt={`${team.name} logo`}
              className="h-12 w-12 mr-4"
            />
            <h1
              className="text-3xl font-bold"
              style={{ color: team.color || '#000' }}
            >
              {team.name}
            </h1>
          </div>
          {renderTable('Batting', stats.batting)}
          {renderTable('Pitching', stats.pitching)}
          {renderTable('Fielding', stats.fielding)}
        </>
      ) : (
        <p className="text-red-600">Team not found.</p>
      )}
    </div>
  )
}
