// pages/players/[id].js

import fs from 'fs'
import path from 'path'
import Layout from '../../components/Layout'

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), 'data/stats/players_combined.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  const paths = data.map(player => ({
    params: { id: player.id }
  }))

  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'data/stats/players_combined.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

  const player = data.find(p => p.id === params.id)

  return {
    props: { player }
  }
}

export default function PlayerPage({ player }) {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{player.name}</h1>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(player).map(([key, value]) => {
            if (['id', 'name', 'link'].includes(key)) return null
            return (
              <div key={key}>
                <strong>{key}:</strong> {value}
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
