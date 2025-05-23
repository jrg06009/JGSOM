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
          <tr className="bg-gray-100 text-xs">
            <th className="border p-1 text-center">Date</th>
            <th className="border p-1 text-center">Team</th>
            <th className="border p-1 text-center">Opponent</th>
            {["G","PA","AB","R","H","2B","3B","HR","RBI","SB","CS","BB","SO","AVG","OBP","SLG","OPS","TB","GDP","HBP","SH","SF","IBB"].map(stat => (
              <th key={stat} className="border p-1 text-center">{stat}</th>
            ))}
            <th className="border p-1 text-center">Boxscore</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            let totAB = 0, totH = 0, totBB = 0, totHBP = 0, totSF = 0, totTB = 0
      
            return games.map((game, i) => {
            const safe = (val) => (val !== undefined && val !== null ? val : 0)
            const rawDate = game.Date?.split(' ')[0] || ''
            const fallbackDate = game["Game ID"]?.split('_')[0] // "19990404"
            const fallbackFormatted = fallbackDate
              ? new Date(`${fallbackDate.slice(0, 4)}-${fallbackDate.slice(4, 6)}-${fallbackDate.slice(6, 8)}`)
                .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
              : '—'

            const date = rawDate
              ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
              : fallbackFormatted
    
            const ab = safe(game.AB)
            const h = safe(game.H)
            const _2b = safe(game["2B"])
            const _3b = safe(game["3B"])
            const hr = safe(game.HR)
            const bb = safe(game.BB)
            const ibb = safe(game.IBB)
            const so = safe(game.SO)
            const hbp = safe(game.HBP)
            const sh = safe(game.SH)
            const sf = safe(game.SF)
            const cs = safe(game.CS)
            const sb = safe(game.SB)
            const rbi = safe(game.RBI)
            const gdp = safe(game.GDP)
  
            const pa = ab + bb + hbp + sf
            const _1b = h - _2b - _3b - hr
            const tb = _1b + (_2b * 2) + (_3b * 3) + (hr * 4)
            
            totAB += ab
            totH += h
            totBB += bb
            totHBP += hbp
            totSF += sf
            totTB += tb

            const cumPA = totAB + totBB + totHBP + totSF
            const avg = totAB > 0 ? totH / totAB : 0
            const obp = cumPA > 0 ? (totH + totBB + totHBP) / cumPA : 0
            const slg = totAB > 0 ? totTB / totAB : 0
            const ops = obp + slg
  
            const oppAbbr = (() => {
              const id = game["Game ID"] || ""
              const parts = id.split('_')[1]?.split('@')
              return parts ? (parts[0] === game.Team ? parts[1] : parts[0]) : ''
            })()

            return (
              <tr key={i} className="text-xs">
                <td className="border p-1 text-center">{date}</td>
                <td className="border p-1 text-center">{game.Team}</td>
                <td className="border p-1 text-center">
                  <img src={`/logos/${oppAbbr}.png`} alt={oppAbbr} className="w-5 h-5 inline-block mr-1" />
                  {oppAbbr}
                </td>
                <td className="border p-1 text-center">1</td>
                <td className="border p-1 text-center">{pa}</td>
                <td className="border p-1 text-center">{ab}</td>
                <td className="border p-1 text-center">{safe(game.R)}</td>
                <td className="border p-1 text-center">{h}</td>
                <td className="border p-1 text-center">{_2b}</td>
                <td className="border p-1 text-center">{_3b}</td>
                <td className="border p-1 text-center">{hr}</td>
                <td className="border p-1 text-center">{rbi}</td>
                <td className="border p-1 text-center">{sb}</td>
                <td className="border p-1 text-center">{cs}</td>
                <td className="border p-1 text-center">{bb}</td>
                <td className="border p-1 text-center">{so}</td>
                <td className="border p-1 text-center">{avg.toFixed(3).replace(/^0\./, '.')}</td>
                <td className="border p-1 text-center">{obp.toFixed(3).replace(/^0\./, '.')}</td>
                <td className="border p-1 text-center">{slg.toFixed(3).replace(/^0\./, '.')}</td>
                <td className="border p-1 text-center">{ops.toFixed(3).replace(/^0\./, '.')}</td>
                <td className="border p-1 text-center">{tb}</td>
                <td className="border p-1 text-center">{gdp}</td>
                <td className="border p-1 text-center">{hbp}</td>
                <td className="border p-1 text-center">{sh}</td>
                <td className="border p-1 text-center">{sf}</td>
                <td className="border p-1 text-center">{ibb}</td>
                <td className="border p-1 text-center">
                  <Link href={`/boxscores/${game["Game ID"]}`} className="text-blue-600 underline hover:text-blue-800">
                  View
                  </Link>
                </td>
              </tr>
            })}
          })()}
        </tbody>
      </table>
    </div>
  )
}

export default BattingGameLog
