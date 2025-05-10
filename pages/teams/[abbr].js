import fs from 'fs'
import path from 'path'
import { useState } from 'react'
import Link from 'next/link'
import {
  calculateBattingTotals,
  calculatePitchingTotals,
  calculateFieldingTotals
} from '../../lib/calculateTotals'

function parseJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

export async function getStaticPaths() {
  const files = fs.readdirSync(path.join(process.cwd(), 'data/stats'))
  const paths = files
    .filter(f => f.endsWith('.json'))
    .map(file => ({ params: { abbr: file.replace('.json', '') } }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const statsPath = path.join(process.cwd(), 'data/stats', `${params.abbr}.json`)
  const stats = parseJson(statsPath)

  const teams = parseJson(path.join(process.cwd(), 'data/teams.json'))
  const schedule = parseJson(path.join(process.cwd(), 'data/schedule.json'))
  const team = teams.find(t => t.id === params.abbr) || null

  if (stats.batting?.length)
    stats.batting.push(calculateBattingTotals(stats.batting))

  if (stats.pitching?.length)
    stats.pitching.push(calculatePitchingTotals(stats.pitching, params.abbr, schedule))

  if (stats.fielding?.length)
    stats.fielding.push(calculateFieldingTotals(stats.fielding))

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

  const hiddenFields = new Set(["id", "PlayerID", "Player ID", "player ID"])
  const headers = Object.keys(data[0]).filter(key => !hiddenFields.has(key))

  const sorted = [...data.slice(0, -1)].sort((a, b) => {
    const valA = a[sortKey]
    const valB = b[sortKey]
    if (numericSort && !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
      return sortAsc ? parseFloat(valA) - parseFloat(valB) : parseFloat(valB) - parseFloat(valA)
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
  })

  const totalRow = data[data.length - 1]

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
                    {key === "Player" && row["Player ID"] ? (
                      <Link href={`/players/${row["Player ID"]}`} className="text-blue-600 hover:underline">
                        {row[key]}
                      </Link>
                    ) : (
                      row[key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {/* Total row */}
            <tr className="font-bold bg-gray-100">
              {headers.map((key) => (
                <td key={key} className="border border-gray-400 p-2 text-center">
                  {totalRow[key] || ''}
                </td>
              ))}
            </tr>
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
            <img src={team.logo} alt={`${team.name} logo`} className="h-12 w-12 mr-4" />
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

            return Object.entries(grouped).map(([pos, group]) => {
              const total = calculateFieldingTotals(group)
              return (
                <SortableTable
                  key={pos}
                  title={`Fielding - ${pos}`}
                  data={[...group.sort((a, b) => parseFloat(b.INN) - parseFloat(a.INN)), total]}
                  defaultSortKey="INN"
                />
              )
            })
          })()}
        </>
      ) : (
        <p className="text-red-600">Team not found.</p>
      )}
    </div>
  )
}
