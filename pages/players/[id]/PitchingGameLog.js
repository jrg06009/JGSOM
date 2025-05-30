
import { useRouter } from 'next/router'
import Link from 'next/link'
import pitchingLog from '../../../data/stats/pitching_log.json'
import teams from '../../../data/teams.json'

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

const formatIP = num => {
  const whole = Math.floor(num)
  const decimal = num - whole
  if (Math.abs(decimal - 2 / 3) < 0.01) return `${whole}.2`
  if (Math.abs(decimal - 1 / 3) < 0.01) return `${whole}.1`
  return `${whole}`
}

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
            {["G #","Date","Team","Opponent","Role","Decision","IP","H","R","ER","HR","BB","IBB","SO","HBP","BK","WP","ERA","WHIP"].map(stat => (
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
            let g = 0, totH = 0, totBB = 0, totW = 0, totL = 0, totS = 0
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
              totH += safe(game['H allowed'])
              totBB += safe(game['BB against'])
              totW += safe(game.W)
              totL += safe(game.L)
              totS += safe(game.S)

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
                  <td className="border p-1 text-center">{(game.GS > 0 ? "Starter" : "Reliever")}</td>
                  <td className="border p-1 text-center">{(() => {
                    const w = safe(game.W), l = safe(game.L), sv = safe(game.SV);
                    if (w) return <span className="text-green-600 font-semibold">W ({totW}-{totL})</span>;
                    if (l) return <span className="text-red-600 font-semibold">L ({totW}-{totL})</span>;
                    if (sv) return <span className="text-blue-600 font-semibold">S ({totS})</span>;
                    return "";
                  })()}
                  </td>
                  <td className="border p-1 text-center">{formatIP(game.IP || '0.0')}</td>
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
                  <td className="border p-1 text-center">{(totIP > 0 ? (totER * 9 / totIP).toFixed(2) : "--")}</td>  
                  <td className="border p-1 text-center">{(totIP > 0 ? ((totH + totBB) / (totIP)).toFixed(2) : "--")}</td>
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
