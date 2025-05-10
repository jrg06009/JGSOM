import { useEffect, useState } from 'react'
import path from 'path'
import fs from 'fs'
import SortableTable from '../components/SortableTable'

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'data/stats/batting.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return { props: { data } }
}

export default function BattingPage({ data }) {
  const [showQualified, setShowQualified] = useState(true)
  const [showSplit, setShowSplit] = useState(false)
  const [filteredData, setFilteredData] = useState([])

  // Approximate games played per team
  const gamesPerTeam = {}
  data.forEach(player => {
    const team = player.team
    const pa = parseFloat(player.PA || 0)
    if (!gamesPerTeam[team]) gamesPerTeam[team] = 0
    gamesPerTeam[team] += pa > 0 ? 1 : 0
  })

  useEffect(() => {
    let filtered = [...data]

    if (showQualified) {
      filtered = filtered.filter(p => {
        const pa = parseFloat(p.PA || 0)
        const games = gamesPerTeam[p.team] || 1
        return pa >= 3.1 * games
      })

      // Remove split lines, keep TOT only
      const seen = new Set()
      filtered = filtered.filter(p => {
        if (p.team === 'TOT') {
          seen.add(p['Player ID'])
          return true
        } else {
          return !seen.has(p['Player ID'])
        }
      })
    } else if (!showQualified && !showSplit) {
      // Remove all non-TOT lines if both boxes unchecked
      const seen = new Set()
      filtered = filtered.filter(p => {
        if (p.team === 'TOT') {
          seen.add(p['Player ID'])
          return true
        }
        return false
      })
    }

    setFilteredData(filtered)
  }, [showQualified, showSplit, data])

  const toggleQualified = () => setShowQualified(!showQualified)
  const toggleSplit = () => setShowSplit(!showSplit)

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Batting Stats</h1>

      <div className="mb-4 space-x-4">
        <label>
          <input type="checkbox" checked={showQualified} onChange={toggleQualified} className="mr-2" />
          Only show qualified players
        </label>
        <label>
          <input type="checkbox" checked={showSplit} onChange={toggleSplit} disabled={showQualified} className="mr-2" />
          Show split seasons
        </label>
      </div>

      <SortableTable
        title=""
        data={filteredData}
        defaultSortKey="PA"
        exclude={['id', 'link']}
        nameLinkField="Player"
        linkBase="/players"
        idField="Player ID"
      />
    </div>
  )
}
