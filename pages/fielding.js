import { useState } from 'react'
import fs from 'fs'
import path from 'path'
import { getTeamToLeagueMap } from '../lib/teamUtils'
import SortableTable from '../components/SortableTable'

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'data', 'stats', 'fielding.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const teamToLeague = getTeamToLeagueMap()

  return { props: { data, teamToLeague } }
}

export default function FieldingPage({ data, teamToLeague }) {
  const [showQualified, setShowQualified] = useState(false)
  const [showSplit, setShowSplit] = useState(true)
  const [league, setLeague] = useState('All')

  const filteredData = data.filter(player => {
    const g = parseInt(player.G || 0, 10)
    const isQualified = !showQualified || g >= 5
    const isSplitOK =
      showSplit ||
      player.team === 'TOT' ||
      !data.some(p => p["Player ID"] === player["Player ID"] && p.team === 'TOT')
    const isLeagueMatch =
      league === 'All' ||
      (player.team in teamToLeague && teamToLeague[player.team] === league)

    return isQualified && isSplitOK && isLeagueMatch
  })

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Fielding Stats</h1>
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
        title="League Fielding"
        data={filteredData}
        defaultSortKey="G"
        exclude={["Player ID"]}
        nameLinkField="Player"
        idField="Player ID"
        linkBase="/players"
      />
    </div>
  )
}
