import fs from 'fs'
import path from 'path'
import { useState } from 'react'
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

function SortableTable({ title, data, numericSort = true }) {
  const [sortKey, setSortKey] = useState(Object.keys(data[0])[0])
  const [sortAsc, setSortAsc] = useState(false)

  const headers = Object.keys(data[0])
  const sorted = [...data].sort((a, b) => {
    const valA = a[sortKey]
    const valB = b[sortKey]
    if (numericSort && !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
      return sortAsc ? parseFloat(valA) - parseFloat(valB) : parseFloat(valB) - parseFloat(valA)
    }
    return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA))
  })

  const handleSort = (key) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <div className="overflow-auto border border-gray-400 rounded">
        <table className="table-auto border-collapse w-full text-sm">
          <thead>
            <tr>
              {headers.map((key) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="cursor-pointer border border-gray-400 p-2 bg-gray-100 hover:bg-gray-200 text-left"
                >
                  {key} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr key={idx}>
                {headers.map((key) => (
                  <td key={key} className="border border-gray-300 p-2 text-center">
                    {row[key]}
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

export default function PlayerPage({ player }) {
  const { batting, pitching, fielding } = player

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">{player.name}</h1>

        {batting && Object.keys(batting).length > 0 && (
          <SortableTable title="Batting Stats" data={[batting]} />
        )}

        {pitching && Object.keys(pitching).length > 0 && (
          <SortableTable title="Pitching Stats" data={[pitching]} />
        )}

        {fielding && fielding.length > 0 && (
          <SortableTable title="Fielding Stats" data={fielding} />
        )}

        {!batting && !pitching && (!fielding || fielding.length === 0) && (
          <p className="text-gray-600 mt-4">No available statistics for this player.</p>
        )}
      </div>
    </Layout>
  )
}
