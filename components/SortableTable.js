
import { useState } from 'react'
import Link from 'next/link'

const headerLabels = {
  team: "Team",
  Player: "Player",
  G: "G",
  PA: "PA",
  AB: "AB",
  R: "R",
  H: "H",
  "2B": "2B",
  "3B": "3B",
  HR: "HR",
  RBI: "RBI",
  SB: "SB",
  CS: "CS",
  BB: "BB",
  SO: "SO",
  AVG: "AVG",
  OBP: "OBP",
  SLG: "SLG",
  OPS: "OPS",
  TB: "TB",
  GIDP: "GIDP",
  HBP: "HBP",
  SH: "SH",
  SF: "SF",
  IBB: "IBB"
}

export default function SortableTable({
  title,
  data,
  defaultSortKey,
  numericSort = true,
  exclude = [],
  nameLinkField = 'Player',
  idField = 'Player ID',
  teamField = 'team',
  linkBase = '/players',
  teamLinkBase = '/teams'
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey)
  const [sortAsc, setSortAsc] = useState(false)

  if (!data || data.length === 0) return null

  const headers = Object.keys(data[0]).filter(
    k => !exclude.includes(k) && k !== idField
  )

  const sorted = [...data].sort((a, b) => {
    const valA = a[sortKey]
    const valB = b[sortKey]
    if (numericSort && !isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
      return sortAsc ? parseFloat(valA) - parseFloat(valB) : parseFloat(valB) - parseFloat(valA)
    }
    return sortAsc
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
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
      {title && <h2 className="text-xl font-bold mb-2">{title}</h2>}
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
                  {headerLabels[key] || key} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr key={idx}>
                {headers.map((key) => (
                  <td key={key} className="border border-gray-300 p-2 text-center">
                    {key === nameLinkField && row[idField] ? (
                      <Link href={`${linkBase}/${row[idField]}`}>
                        <a className="text-blue-600 hover:underline">{row[key]}</a>
                      </Link>
                    ) : key === teamField ? (
                      <Link href={`${teamLinkBase}/${row[key]}`}>
                        <a className="text-blue-600 hover:underline">{row[key]}</a>
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
