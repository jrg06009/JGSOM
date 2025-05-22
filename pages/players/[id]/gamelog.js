import { useRouter } from 'next/router'
import Link from 'next/link'
import battingLog from '../../../data/stats/batting_log.json'
import teams from '../../../data/teams.json'

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

const BattingGameLog = () => {
  const router = useRouter()
  const { id } = router.query
  if (!id) return <div className="p-4">Loading...</div>

  const games = battingLog.filter(row => row["Player ID"] === id)
  if (games.length === 0) return <div className="p-4 text-red-600">No game logs for this player.</div>

  const name = games[0].Player

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">{name} - Batting Game Log</h1>
      <Link href={`/players/${id}`} className="text-blue-600 underline hover:text-blue-800 block mb-4">
        ← Back to player page
      </Link>
      <table className="w-full text-sm border border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-center">Date</th>
            <th className="border p-1 text-center">Team</th>
            <th className="border p-1 text-center">Opponent</th>
            <th className="border p-1 text-center">AB</th>
            <th className="border p-1 text-center">H</th>
            <th className="border p-1 text-center">R</th>
            <th className="border p-1 text-center">RBI</th>
            <th className="border p-1 text-center">BB</th>
            <th className="border p-1 text-center">SO</th>
            <th className="border p-1 text-center">Boxscore</th>
          </tr>
        </thead>
        <tbody>
          {games.map((game, i) => {
            const rawDate = game.Date?.split(' ')[0] || ''
            const date = rawDate
              ? new Date(rawDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
              : ''
            const playerTeam = game.Team
            const opponent = playerTeam === game.Team ? game.Team : game.Team // placeholder if you add actual opponent logic later
            const gameID = game["Game ID"]
            const safe = (val) => (val !== undefined && val !== null ? val : 0)
            return (
              <tr key={i}>
                <td className="border p-1 text-center">{date}</td>
                <td className="border p-1 text-center">{playerTeam}</td>
                <td className="border p-1 text-center">{teamMap[playerTeam]?.name || playerTeam}</td>
                <td className="border p-1 text-center">{safe(game.AB)}</td>
                <td className="border p-1 text-center">{safe(game.H)}</td>
                <td className="border p-1 text-center">{safe(game.R)}</td>
                <td className="border p-1 text-center">{safe(game.RBI)}</td>
                <td className="border p-1 text-center">{safe(game.BB)}</td>
                <td className="border p-1 text-center">{safe(game.SO)}</td>
                <td className="border p-1 text-center">
                  <Link href={`/boxscores/${gameID}`} className="text-blue-600 underline hover:text-blue-800">
                    View
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default BattingGameLog
