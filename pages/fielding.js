import { useState } from 'react'
import { getTeamToLeagueMap, getTeamGamesPlayedMap } from '../lib/teamUtils'
import { getTeamGamesPlayedFromSchedule } from '../lib/teamUtils'
import SortableTable from '../components/SortableTable'

export async function getStaticProps() {
  const fs = await import('fs')
  const path = await import('path')
  const filePath = path.join(process.cwd(), 'data', 'stats', 'fielding.json')
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const schedulePath = path.join(process.cwd(), 'data', 'schedule.json')
  const teams = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'teams.json'), 'utf8')
  )
  const schedule = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'schedule.json'), 'utf8')
  )
  const teamToLeague = getTeamToLeagueMap(teams)
  const teamGames = getTeamGamesPlayedFromSchedule(schedule)
  const fieldingData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'data', 'stats', 'fielding.json'), 'utf8')
  )

  return { props: { data:fieldingData, teamToLeague, teamGames } }
}

export default function FieldingPage({ data, teamToLeague, teamGames }) {
  const [showQualified, setShowQualified] = useState(true)
  const [showSplit, setShowSplit] = useState(false)
  const [league, setLeague] = useState('All')

  const filteredData = data.filter(player => {
    const g = parseInt(player.G || 0, 10)
    const team = player.team
    const teamGameTotal = teamGames[team] || 0
    const qualified = !showQualified || (teamGameTotal > 0 && g >= 0.67 * teamGameTotal)

    const isSplitOK =
      showSplit ||
      player.team === 'TOT' ||
      !data.some(p => p["Player ID"] === player["Player ID"] && p.team === 'TOT')

    const leagueMatch =
      league === 'All' ||
      (team in teamToLeague && teamToLeague[team] === league)

    return qualified && isSplitOK && leagueMatch
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
              setShowQualified(!showQualified)
              if (!showQualified) setShowSplit(false)
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
            className="mr-2"
            disabled={showQualified}
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
        teamField="team"
        linkBase="/players"
        teamLinkBase="/teams"
      />
    </div>
  )
}
