import fs from 'fs'
import path from 'path'
import Layout from '../../components/Layout'

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), 'data', 'players_combined.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  const paths = data
    .filter(player => typeof player.id === 'string' && player.id.trim() !== '')
    .map(player => ({
      params: { id: player.id }
    }))

  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'data', 'players_combined.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const player = data.find(p => p.id === params.id)

  return {
    props: {
      player
    }
  }
}

export default function PlayerPage({ player }) {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">{player.name}</h1>

        {/* Batting */}
        {player.batting && Object.keys(player.batting).length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-4 mb-2">Batting Stats</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border border-gray-300 mb-6">
                <thead>
                  <tr>
                    {Object.keys(player.batting).map(key => (
                      <th key={key} className="border px-2 py-1 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Object.keys(player.batting).map(key => (
                      <td key={key} className="border px-2 py-1">{player.batting[key]}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pitching */}
        {player.pitching && Object.keys(player.pitching).length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-4 mb-2">Pitching Stats</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border border-gray-300 mb-6">
                <thead>
                  <tr>
                    {Object.keys(player.pitching).map(key => (
                      <th key={key} className="border px-2 py-1 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Object.keys(player.pitching).map(key => (
                      <td key={key} className="border px-2 py-1">{player.pitching[key]}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Fielding by position */}
        {player.fielding && Object.keys(player.fielding).length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-4 mb-2">Fielding Stats</h2>
            {Object.entries(player.fielding).map(([pos, stats]) => (
              <div key={pos}>
                <h3 className="text-lg font-medium mt-4 mb-1">{pos}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border border-gray-300 mb-6">
                    <thead>
                      <tr>
                        {Object.keys(stats).map(key => (
                          <th key={key} className="border px-2 py-1 text-left">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {Object.keys(stats).map(key => (
                          <td key={key} className="border px-2 py-1">{stats[key]}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}

        {/* No data fallback */}
        {!player.batting && !player.pitching && (!player.fielding || Object.keys(player.fielding).length === 0) && (
          <p className="text-gray-600 mt-4">No available statistics for this player.</p>
        )}
      </div>
    </Layout>
  )
}
