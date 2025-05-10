import fs from 'fs'
import path from 'path'
import Layout from '../../components/Layout'

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), 'data/stats/players_combined.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  const paths = data
    .filter(player => typeof player.id === 'string' && player.id.trim() !== '')
    .map(player => ({
      params: { id: player.id }
    }))

  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'data/stats/players_combined.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const player = data.find(p => p.id === params.id)

  return {
    props: {
      player
    }
  }
}

function StatTable({ title, data }) {
  const keys = Object.keys(data)
  return (
    <>
      <h2 className="text-xl font-semibold mt-4 mb-2">{title}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border border-gray-300 mb-6">
          <thead>
            <tr>
              {keys.map(key => (
                <th key={key} className="border px-2 py-1 text-left">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {keys.map(key => (
                <td key={key} className="border px-2 py-1">{data[key]}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

export default function PlayerPage({ player }) {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-4">{player.name}</h1>

        {player.batting && Object.keys(player.batting).length > 0 && (
          <StatTable title="Batting Stats" data={player.batting} />
        )}

        {player.pitching && Object.keys(player.pitching).length > 0 && (
          <StatTable title="Pitching Stats" data={player.pitching} />
        )}

        {player.fielding && Object.keys(player.fielding).length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-4 mb-2">Fielding Stats</h2>
            {Object.entries(player.fielding).map(([pos, stats]) => (
              <StatTable key={pos} title={`Fielding - ${pos}`} data={stats} />
            ))}
          </>
        )}

        {!player.batting?.G && !player.pitching?.G && Object.keys(player.fielding || {}).length === 0 && (
          <p className="text-gray-600 mt-4">No statistics available for this player.</p>
        )}
      </div>
    </Layout>
  )
}
