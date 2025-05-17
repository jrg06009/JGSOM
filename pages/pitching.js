
import { useState } from 'react'
import { getTeamToLeagueMap } from '../lib/teamUtils'
import SortableTable from '../components/SortableTable'

export async function getStaticProps() {
  const fs = await import('fs')
  const path = await import('path')
  const filePath = path.join(process.cwd(), 'data', 'stats', 'pitching.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const teams = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'teams.json'), 'utf8'))
  const teamToLeague = getTeamToLeagueMap(teams)

  return { props: { data, teamToLeague } }
}

export default function PitchingPage({ data, teamToLeague }) {
  const [showQualified, setShowQualified] = useState(true)
  const [showSplit, setShowSplit] = useState(false)
  const [league, setLeague] = useState('All')

  const filteredData = data.filter(player => {
    const ip = parseFloat(player.IP || 0)
    const isQualified = !showQualified || ip >= 3
    const isSplitOK =
      showSplit ||
      player.team === 'TOT' ||
      !data.some(p => p["Player ID"] === player["Player ID"] && p.team === 'TOT')
    const isLeagueMatch =
      league === 'All' ||
      (player.team in teamToLeague && teamToLeague[player.team] === league)
    return isQualified && isSplitOK && isLeagueMatch
  }).map(row => ({
    ...row,
    ERA: parseFloat(row.ERA).toFixed(2),
    "W-L%": parseFloat(row["W-L%"]).toFixed(3),
    H9: parseFloat(row.H9).toFixed(1),
    HR9: parseFloat(row.HR9).toFixed(1),
    BB9: parseFloat(row.BB9).toFixed(1),
    SO9: parseFloat(row.SO9).toFixed(1),
    "SO/BB": parseFloat(row["SO/BB"]).toFixed(1)
  }))

  const displayedColumns = [
    "Player", "team", "W", "L", "W-L%", "ERA", "G", "GS", "CG", "SHO", "SV",
    "IP", "H", "R", "ER", "HR", "BB", "IBB", "SO", "HBP", "BK", "WP",
    "H9", "HR9", "BB9", "SO9", "SO/BB"
  ]

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Pitching Stats</h1>
      <div className="mb-4 flex flex-wrap gap-6 items-center">
        <label className="flex items-center">
          <input type="checkbox" checked={showQualified} onChange={() => setShowQualified(!showQualified)} className="mr-2" />
          Only show qualified players
        </label>
        <label className="flex items-center">
          <input type="checkbox" checked={showSplit} onChange={() => setShowSplit(!showSplit)} className="mr-2" />
          Show split seasons
        </label>
        <label className="flex items-center">
          <span className="mr-2 font-medium">League:</span>
          <select value={league} onChange={e => setLeague(e.target.value)} className="border border-gray-300 rounded px-2 py-1">
            <option value="All">All Leagues</option>
            <option value="AL">American League</option>
            <option value="NL">National League</option>
          </select>
        </label>
      </div>

      <SortableTable
        title="League Pitching"
        data={filteredData}
        defaultSortKey="IP"
        exclude={["Player ID"]}
        nameLinkField="Player"
        idField="Player ID"
        linkBase="/players"
        includeColumns={displayedColumns}
      />
    </div>
  )
}
