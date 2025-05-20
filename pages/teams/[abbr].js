import teams from '../../data/teams.json'
import batting from '../../data/stats/batting.json'
import pitching from '../../data/stats/pitching.json'
import fielding from '../../data/stats/fielding.json'
import { useRouter } from 'next/router'
import Link from 'next/link'

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

export async function getStaticPaths() {
  const paths = teams.map(t => ({ params: { abbr: t.id } }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  return {
    props: {
      abbr: params.abbr,
      team: teamMap[params.abbr] || null
    }
  }
}

const sumStat = (arr, key) => arr.reduce((sum, p) => sum + (parseFloat(p[key]) || 0), 0)
const sumIP = (arr) => {
  return arr.reduce((sum, p) => {
    const val = p["IP"]
    if (!val) return sum
    const [whole, frac] = val.split(".").map(Number)
    const thirds = frac === 2 ? 2 : frac === 1 ? 1 : 0
    return sum + whole + thirds / 3
  }, 0)
}
const formatPct = (num) => {
  const parsed = parseFloat(num)
  if (isNaN(parsed)) return ''
  return parsed.toFixed(3)
}
const formatRate = (num) => {
  const parsed = parseFloat(num)
  if (isNaN(parsed)) return ''
  return parsed.toFixed(2)
}
const formatIP = (num) => {
  const whole = Math.floor(num)
  const decimal = num - whole
  if (Math.abs(decimal - 2 / 3) < 0.01) return `${whole}.2`
  if (Math.abs(decimal - 1 / 3) < 0.01) return `${whole}.1`
  return `${whole}`
}

const TeamPage = ({ abbr, team }) => {
  if (!team) return <div className="p-4 text-red-600">Team not found.</div>

  const bStats = batting.filter(p => p.team === abbr)
  const pStats = pitching.filter(p => p.team === abbr)
  const fStats = fielding.filter(p => p.team === abbr)

  const renderTable = (title, stats, keys, calcFns = {}) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <table className="w-full text-sm border border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left">Player</th>
            {keys.map(key => (
              <th key={key} className="border p-1 text-center">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map((p, i) => (
            <tr key={i}>
              <td className="border p-1 text-left">
                <Link href={`/players/${p['Player ID']}`} className="text-blue-700 underline">{p.Player}</Link>
              </td>
              {keys.map(key => (
                <td key={key} className="border p-1 text-center">{p[key] ?? ''}</td>
              ))}
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td className="border p-1 text-left">Total</td>
            {keys.map(key => {
              const calc = calcFns[key]
              const val = calc ? calc(stats) : sumStat(stats, key)
              const formatted = (key === 'AVG' || key === 'OBP' || key === 'SLG' || key === 'OPS' || key === 'W-L%' || key === 'Fld%') ? formatPct(val) :
                (key === 'ERA' || key === 'H9' || key === 'HR9' || key === 'BB9' || key === 'SO9' || key === 'SO/BB') ? formatRate(val) :
                (key === 'IP') ? formatIP(val) : val
              return <td key={key} className="border p-1 text-center">{formatted}</td>
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <img src={team.logo} alt={team.name} className="h-12 mr-4" />
        <h1 className="text-2xl font-bold" style={{ color: team.color }}>{team.name}</h1>
      </div>
      {renderTable("Batting", bStats, [
        'G','PA','AB','R','H','2B','3B','HR','RBI','SB','CS','BB','IBB','SO','AVG','OBP','SLG','OPS','TB','GDP','HBP','SH','SF'
      ], {
        'AVG': arr => sumStat(arr, 'H') / sumStat(arr, 'AB'),
        'OBP': arr => (sumStat(arr, 'H') + sumStat(arr, 'BB') + sumStat(arr, 'HBP')) / (sumStat(arr, 'AB') + sumStat(arr, 'BB') + sumStat(arr, 'HBP') + sumStat(arr, 'SF')),
        'SLG': arr => sumStat(arr, 'TB') / sumStat(arr, 'AB'),
        'OPS': arr => {
          const obp = (sumStat(arr, 'H') + sumStat(arr, 'BB') + sumStat(arr, 'HBP')) / (sumStat(arr, 'AB') + sumStat(arr, 'BB') + sumStat(arr, 'HBP') + sumStat(arr, 'SF'))
          const slg = sumStat(arr, 'TB') / sumStat(arr, 'AB')
          return obp + slg
        }
      })}
      {renderTable("Pitching", pStats, [
        'W','L','W-L%','ERA','G','GS','CG','SHO','SV','IP','H','R','ER','HR','BB','IBB','SO','HBP','BK','WP','H9','HR9','BB9','SO9','SO/BB'
      ], {
        'W-L%': arr => {
          const W = sumStat(arr, 'W'), L = sumStat(arr, 'L')
          return W + L > 0 ? W / (W + L) : ''
        },
        'ERA': arr => {
          const ER = sumStat(arr, 'ER'), IP = sumIP(arr)
          return IP > 0 ? (ER * 9) / IP : ''
        },
        'H9': arr => sumIP(arr) > 0 ? sumStat(arr, 'H') * 9 / sumIP(arr) : '',
        'HR9': arr => sumIP(arr) > 0 ? sumStat(arr, 'HR') * 9 / sumIP(arr) : '',
        'BB9': arr => sumIP(arr) > 0 ? sumStat(arr, 'BB') * 9 / sumIP(arr) : '',
        'SO9': arr => sumIP(arr) > 0 ? sumStat(arr, 'SO') * 9 / sumIP(arr) : '',
        'SO/BB': arr => sumStat(arr, 'BB') > 0 ? sumStat(arr, 'SO') / sumStat(arr, 'BB') : ''
      })}
      {renderTable("Fielding", fStats, [
        'G','GS','CG','Inn','Ch','PO','A','E','DP','Fld%','PB','WP','SB','CS','CS%','PkO'
      ], {
        'Fld%': arr => {
          const PO = sumStat(arr, 'PO'), A = sumStat(arr, 'A'), E = sumStat(arr, 'E')
          const total = PO + A + E
          return total > 0 ? (PO + A) / total : ''
        }
      })}
    </div>
  )
}

export default TeamPage
