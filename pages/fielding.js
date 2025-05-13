import { useState } from 'react'
import fs from 'fs'
import path from 'path'
import SortableTable from '../components/SortableTable'
import { getTeamToLeagueMap } from '../lib/teamUtils'
import { getTeamGamesPlayed } from '../lib/qualification'

export async function getStaticProps() {
  const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/stats/fielding.json'), 'utf8'))
  const schedule = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/schedule.json'), 'utf8'))
  const teamToLeague = getTeamToLeagueMap()
  const gamesPlayed = getTeamGamesPlayed(schedule)
  return { props: { data, teamToLeague, gamesPlayed } }
}

export default function FieldingPage({ data, teamToLeague, gamesPlayed }) {
  const [showQualified, setShowQualified] = useState(false)
  const [showSplit, setShowSplit] = useState(true)
  const [league, setLeague] = useState('All')

  const filteredData = data.filter(player => {
    const team = player.team
    const g = parseInt(player.G || 0, 10)
    const games = gamesPlayed[team] || 0
    const gMin = 0.67 * games

    const isQualified = !showQualified || g >= gMin
    const isSplitOK = showQualified
      ? false
      : (showSplit || player.team === 'TOT' || !data.some(p => p["Player ID"] === player["Player ID"] && p.team === 'TOT'))

    const isLeagueMatch =
      league === 'All' ||
      (team in teamToLeague && teamToLeague[team] === league)

    return isQualified && isSplitOK && isLeagueMatch
  })

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Fielding Stats</h1>

      <div className="mb-4 flex flex-wrap gap-6 items-center">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showQualified}
            onChange={() => {
              const next = !showQualified
              setShowQualified(next)
              if (next) setShowSplit(false)
            }}
            className="mr-2"
          />
          Only show qualified players
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showSplit}
            onChange={() => setShowSplit(!showSplit)}
            disabled={showQualified}
            className="mr-2"
          />
          Show split seasons
        </label>

        <label className="flex items-center">
          <span className="mr-2 font-medium">League:</span>
          <select
            value={league}
            onChange={e => setLeague(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
          >
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
        teamField="Team"
      />
    </div>
  )
}
