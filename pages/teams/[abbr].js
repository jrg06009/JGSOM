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
const formatPct = (num) => (num === 1 ? '1.000' : num ? num.toFixed(3).slice(1) : '')
const formatRate = (num) => (num === '' || isNaN(num)) ? '' : parseFloat(num).toFixed(2)

const renderTable = (title, data, columns, sortKey) => {
  const sorted = [...data].sort((a, b) => (parseFloat(b[sortKey]) || 0) - (parseFloat(a[sortKey]) || 0))

  const totals = {}
  columns.forEach(col => {
    if (['AVG', 'OBP', 'SLG', 'OPS', 'ERA', 'H9', 'HR9', 'BB9', 'SO9', 'SO/BB', 'W-L%'].includes(col)) return
    totals[col] = sumStat(sorted, col)
  })

  if ('AVG' in sorted[0]) {
    totals['AVG'] = formatPct(totals['H'] / totals['AB'])
    totals['OBP'] = formatPct((totals['H'] + totals['BB'] + totals['HBP']) / (totals['AB'] + totals['BB'] + totals['HBP'] + totals['SF']))
    totals['SLG'] = formatPct(totals['TB'] / totals['AB'])
    totals['OPS'] = formatPct(((totals['H'] + totals['BB'] + totals['HBP']) / (totals['AB'] + totals['BB'] + totals['HBP'] + totals['SF'])) + (totals['TB'] / totals['AB']))
  }
  if ('ERA' in sorted[0]) {
    totals['ERA'] = formatRate((totals['ER'] * 9) / parseFloat(totals['IP']))
    totals['W-L%'] = totals['W'] + totals['L'] > 0 ? formatPct(totals['W'] / (totals['W'] + totals['L'])) : ''
    totals['H9'] = formatRate(totals['H'] * 9 / parseFloat(totals['IP']))
    totals['HR9'] = formatRate(totals['HR'] * 9 / parseFloat(totals['IP']))
    totals['BB9'] = formatRate(totals['BB'] * 9 / parseFloat(totals['IP']))
    totals['SO9'] = formatRate(totals['SO'] * 9 / parseFloat(totals['IP']))
    totals['SO/BB'] = formatRate(totals['BB'] > 0 ? totals['SO'] / totals['BB'] : 0)
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <table className="w-full text-sm border border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left">Player</th>
            {columns.map(col => (
              <th key={col} className="border p-1 text-center">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={i}>
              <td className="border p-1 text-left">
                <Link href={`/players/${p['Player ID']}`} className="text-blue-700 underline">{p.Player}</Link>
              </td>
              {columns.map(col => (
                <td key={col} className="border p-1 text-center">{p[col] ?? ''}</td>
              ))}
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td className="border p-1 text-left">Total</td>
            {columns.map(col => (
              <td key={col} className="border p-1 text-center">{totals[col] ?? ''}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const TeamPage = ({ abbr, team }) => {
  if (!team) return <div className="p-4 text-red-600">Team not found.</div>

  const bStats = batting.filter(p => p.team === abbr)
  const pStats = pitching.filter(p => p.team === abbr)
  const fStats = fielding.filter(p => p.team === abbr)

  const battingKeys = ['G','PA','AB','R','H','2B','3B','HR','RBI','SB','CS','BB','IBB','SO','AVG','OBP','SLG','OPS','TB','GDP','HBP','SH','SF']
  const pitchingKeys = ['W','L','W-L%','ERA','G','GS','CG','SHO','SV','IP','H','R','ER','HR','BB','IBB','SO','HBP','BK','WP','H9','HR9','BB9','SO9','SO/BB']
  const fieldingKeys = ['G','GS','CG','Inn','Ch','PO','A','E','DP','Fld%','PB','WP','SB','CS','CS%','PkO']

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <img src={team.logo} alt={team.name} className="h-12 mr-4" />
        <h1 className="text-2xl font-bold" style={{ color: team.color }}>{team.name}</h1>
      </div>
      {renderTable("Batting", bStats, battingKeys, 'PA')}
      {renderTable("Pitching", pStats, pitchingKeys, 'IP')}
      {renderTable("Fielding", fStats, fieldingKeys, 'G')}
    </div>
  )
}

export default TeamPage
