
import { useRouter } from 'next/router'
import Link from 'next/link'
import pitchingLog from '../../../data/stats/pitching_log.json'
import teams from '../../../data/teams.json'

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

const PitchingGameLog = () => {
  const router = useRouter()
  const { id } = router.query
  if (!id) return <div className="p-4">Loading...</div>

  const games = pitchingLog.filter(row => row["Player ID"] === id)
  if (games.length === 0) return <div className="p-4 text-red-600">No game logs for this player.</div>

  const name = games[0].Player

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">{name} - Pitching Game Log</h1>
      <Link href={`/players/${id}`} className="text-blue-600 underline hover:text-blue-800 block mb-4">
        ← Back to player page
      </Link>
      <table className="w-full text-sm border border-collapse">
        <thead>
          <tr className="bg-gray-100 text-xs">
            {["G","Date","Team","Opponent","GS","W","L","SV","IP","H","R","ER","HR","BB","IBB","SO","HBP","BK","WP","SB","CS"].map(stat => (
              <th key={stat} className="border p-1 text-center">{stat}</th>
            ))}
            <th className="border p-1 text-center">Boxscore</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            let totIP = 0, totER = 0

            const parseIP = (ipStr) => {
              const parts = String(ipStr).split('.')
              const whole = parseInt(parts[0] || '0', 10)
              const frac = parseInt(parts[1] || '0', 10)
              return whole + (frac === 1 ? 1/3 : frac === 2 ? 2/3 : 0)
            }
            let g=0
            return games.map((game, i) => {
              const safe = (val) => (val !== undefined && val !== null ? val : 0)
              const rawDate = game["Game ID"]?.split('_')[0]
              const date = rawDate
                ? new Date(`${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`)
                    .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                : '—'

              const ip = game.IP ? parseIP(game.IP) : 0
              const er = safe(game.ER)

              totIP += ip
              totER += er

              const oppAbbr = (() => {
                const id = game["Game ID"] || ""
                const parts = id.split('_')[1]?.split('@')
                return parts ? (parts[0] === game.Team ? parts[1] : parts[0]) : ''
              })()

              return (
                <tr key={i} className="text-xs">
                  <td className="border p-1 text-center">{++g}</td>                  
                  <td className="border p-1 text-center">{date}</td>
                  <td className="border p-1 text-center">{game.Team}</td>
                  <td className="border p-1 text-center">
                    <img src={`/logos/${oppAbbr}.png`} alt={oppAbbr} className="w-5 h-5 inline-block mr-1" />
                    {oppAbbr}
                  </td>
                  <td className="border p-1 text-center">{safe(game.GS)}</td>
                  <td className="border p-1 text-center">{safe(game.W)}</td>
                  <td className="border p-1 text-center">{safe(game.L)}</td>
                  <td className="border p-1 text-center">{safe(game.SV)}</td>
                  <td className="border p-1 text-center">{game.IP || '0.0'}</td>
                  <td className="border p-1 text-center">{safe(game["H allowed"])}</td>
                  <td className="border p-1 text-center">{safe(game["R against"])}</td>
                  <td className="border p-1 text-center">{er}</td>
                  <td className="border p-1 text-center">{safe(game["HR allowed"])}</td>
                  <td className="border p-1 text-center">{safe(game["BB against"])}</td>
                  <td className="border p-1 text-center">{safe(game["IBB against"])}</td>
                  <td className="border p-1 text-center">{safe(game["SO against"])}</td>
                  <td className="border p-1 text-center">{safe(game.HBP)}</td>
                  <td className="border p-1 text-center">{safe(game.BK)}</td>
                  <td className="border p-1 text-center">{safe(game.WP)}</td>
                  <td className="border p-1 text-center">{safe(game["SB against"])}</td>
                  <td className="border p-1 text-center">{safe(game["CS against"])}</td>
                  <td className="border p-1 text-center">
                    <Link href={`/boxscores/${game["Game ID"]}`} className="text-blue-600 underline hover:text-blue-800">
                      View
                    </Link>
                  </td>
                </tr>
              )
            })
          })()}
        </tbody>
      </table>
    </div>
  )
}

export default PitchingGameLog
