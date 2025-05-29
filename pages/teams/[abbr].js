import teams from '../../data/teams.json'
import batting from '../../data/stats/batting.json'
import pitching from '../../data/stats/pitching.json'
import fielding from '../../data/stats/fielding.json'
import { useState } from 'react'
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
    if (!val) return sum;
    const [wholeStr, fracStr] = val.split(".");
    const whole = parseInt(wholeStr, 10) || 0;
    const frac = parseInt(fracStr, 10) || 0;
    let decimal = 0;
    if (frac === 1) decimal = 1 / 3;
    else if (frac === 2) decimal = 2 / 3;
    return sum + whole + decimal;
  }, 0)
}
const formatPct = (num) => {
  if (num === null || num === undefined || isNaN(num)) return ''
  const val = parseFloat(num)
  return val === 1 ? '1.000' : val.toFixed(3).replace(/^0\./, '.')
}
const formatPerNine = (num) => {
  if (num === null || num === undefined || isNaN(num)) return ''
  const val = parseFloat(num)
  return val >= 1 ? val.toFixed(1) : val.toFixed(1).replace(/^0\./, '.')
}
const formatERA = (num) => {
  if (num === null || num === undefined || isNaN(num)) return ''
  const val = parseFloat(num)
  return val >= 1 ? val.toFixed(2) : val.toFixed(2).replace(/^0\./, '.')
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
  const teamwins = sumStat(pStats, 'W')
  const teamlosses = sumStat(pStats, 'L')

  const renderTable = (title, stats, keys, calcFns = {}, defaultSortKey = keys[0]) => {
    const [sortKey, setSortKey] = useState(defaultSortKey)
    const [sortAsc, setSortAsc] = useState(false)
    if (!stats || stats.length === 0) return null
    const sortedStats = [...stats].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]
      if (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
        return sortAsc ? parseFloat(valA) - parseFloat(valB) : parseFloat(valB) - parseFloat(valA)
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA))
    })

    return (
      <div className="mb-8">
        <div className="overflow-x-auto"><h2 className="text-xl font-semibold mb-2 sticky left-0 z-10">{title}</h2>
        <table className="w-full text-sm border border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1 text-left bg-gray-100 sticky left-0 z-10 border-r-4 border-gray-300">Player</th>
              {keys.map(key => (
                <th 
                  key={key}
                  onClick={() => {
                    if (sortKey === key) setSortAsc(!sortAsc)
                    else {
                      setSortKey(key)
                      setSortAsc(false)
                    }
                  }}
                  className="border p-1 text-center hover:bg-gray-200"
                >
                  {key} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((p, i) => (
              <tr key={i}>
                <td className="border p-1 text-left bg-white sticky left-0 z-10 border-r-4 border-gray-300">
                  <Link href={`/players/${p['Player ID']}`} className="text-blue-700 underline">{p.Player}</Link>
                </td>
                {keys.map(key => (
                  <td key={key} className="border p-1 text-center">{p[key] ?? ''}</td>
                ))}
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td className="border p-1 text-left bg-gray-50 font-bold sticky left-0 z-10 border-r-4 border-gray-300">Total</td>
              {keys.map(key => {
                const calc = calcFns[key]
                const val = calc ? calc(stats) : sumStat(stats, key)
                const formatted = (key === 'AVG' || key === 'OBP' || key === 'SLG' || key === 'OPS' || key === 'W-L%' || key === 'Fld%') ? formatPct(val) :
                  (key === 'ERA' ) ? formatERA (val) :
                  (key === 'H9' || key === 'HR9' || key === 'BB9' || key === 'SO9' || key === 'SO/BB') ? formatPerNine(val) :
                  (key === 'IP') ? formatIP(val) : val
                return <td key={key} className="border p-1 text-center">{formatted}</td>
              })}
            </tr>
          </tbody>
        </table></div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <img src={team.logo} alt={team.name} className="w-20 h-20 mr-4" />
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold mb-1" style={{ color: team.color }}>{team.name}</h1>
          <p className="text-lg text-gray-700">Record: {teamwins}–{teamlosses}</p>
          <Link href={`/teams/${abbr}/schedule`} className="text-blue-600 underline hover:text-blue-800">
            View full schedule →
          </Link>
        </div>
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
      },"PA")}
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
      },"IP")}
      {renderTable("Fielding", fStats, [
        'G','GS','CG','Inn','Ch','PO','A','E','DP','Fld%','PB','WP','SB','CS','CS%','PkO'
      ], {
        'Fld%': arr => {
          const PO = sumStat(arr, 'PO'), A = sumStat(arr, 'A'), E = sumStat(arr, 'E')
          const total = PO + A + E
          return total > 0 ? (PO + A) / total : ''
        }
      },"Inn")}
    </div>
  )
}

export default TeamPage
