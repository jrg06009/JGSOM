// pages/teams/[id].js

import fs from 'fs'
import path from 'path'
import Layout from '../../components/Layout'
import Link from 'next/link'

export async function getStaticPaths() {
  const statsPath = path.join(process.cwd(), 'data/stats')
  const teamFiles = fs.readdirSync(statsPath).filter(name => name.endsWith('.json') && name !== 'players_combined.json')
  const paths = teamFiles.map(name => ({
    params: { id: name.replace('.json', '') }
  }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'data/stats', `${params.id}.json`)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return {
    props: {
      teamId: params.id,
      teamData: data
    }
  }
}

export default function TeamPage({ teamId, teamData }) {
  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Team: {teamId}</h1>

        {['batting', 'pitching', 'fielding'].map(section => (
          teamData[section] && Array.isArray(teamData[section]) && (
            <div key={section} className="mb-8">
              <h2 className="text-lg font-semibold capitalize mb-2">{section}</h2>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    {Object.keys(teamData[section][0]).map(key => (
                      <th key={key} className="border px-2 py-1">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamData[section].map((player, idx) => (
                    <tr key={idx}>
                      {Object.entries(player).map(([key, value]) => (
                        <td key={key} className="border px-2 py-1">
                          {key === 'name' && player.id ? (
                            <Link href={`/players/${player.id}`}>
                              <a className="text-blue-600 underline">{value}</a>
                            </Link>
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ))}
      </div>
    </Layout>
  )
}