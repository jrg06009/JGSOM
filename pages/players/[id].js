// pages/players/[id].js
import fs from 'fs'
import path from 'path'
import Layout from '@/components/Layout'

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), 'data', 'players_combined.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  const paths = data.map(player => ({
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
  const exclude = new Set(['id', 'name'])
  const battingKeys = Object.keys(player).filter(key => !exclude.has(key) && !key.includes('.1'))
  const pitchingKeys = Object.keys(player).filter(key => key.includes('.1') || ['ERA', 'WHIP', 'SO9'].includes(key))

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{player.name}</h1>

        {battingKeys.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-4 mb-2">Batting Stats</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border border-gray-300 mb-6">
                <thead>
                  <tr>
                    {battingKeys.map(key => (
                      <th key={key} className="border px-2 py-1 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {battingKeys.map(key => (
                      <td key={key} className="border px-2 py-1">{player[key]}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {pitchingKeys.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mt-4 mb-2">Pitching Stats</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border border-gray-300">
                <thead>
                  <tr>
                    {pitchingKeys.map(key => (
                      <th key={key} className="border px-2 py-1 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {pitchingKeys.map(key => (
                      <td key={key} className="border px-2 py-1">{player[key]}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
