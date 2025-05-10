import fs from 'fs'
import path from 'path'
import { useState } from 'react'
import Link from 'next/link'

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

function SortableTable({ title, data, defaultSortKey, numericSort = true }) {
  const [sortKey, setSortKey] = useState(defaultSortKey)
  const [sortAsc, setSortAsc] = useState(false)

  if (!data || data.length === 0) return null

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
                    {key === 'name' && row.id ? (
                      <Link href={`/players/${row.id}`}>
                        <a className="text-blue-600 underline">{row[key]}</a>
                      </Link>
                    ) : (
                      row[key]
                    )}
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

export default function TeamPage({ abbr, stats, team }) {
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
            <h1 className="text-3xl font-bold" style={{ color: team.color || '#000' }}>
              {team.name}
            </h1>
          </div>

          <SortableTable title="Batting" data={stats.batting} defaultSortKey="PA" />
          <SortableTable title="Pitching" data={stats.pitching} defaultSortKey="IP" />

          {stats.fielding && (() => {
            const grouped = stats.fielding.reduce((acc, player) => {
              const pos = player.POS || "Unknown"
              if (!acc[pos]) acc[pos] = []
              acc[pos].push(player)
              return acc
            }, {})

            return Object.entries(grouped).map(([pos, group]) => (
              <SortableTable
                key={pos}
                title={`Fielding - ${pos}`}
                data={group.sort((a, b) => parseFloat(b.INN) - parseFloat(a.INN))}
                defaultSortKey="INN"
              />
            ))
          })()}
        </>
      ) : (
        <p className="text-red-600">Team not found.</p>
      )}
    </div>
  )
}
