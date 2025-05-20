import teams from '../../data/teams.json'
import batting from '../../data/stats/batting.json'
import pitching from '../../data/stats/pitching.json'
import fielding from '../../data/stats/fielding.json'
import { useRouter } from 'next/router'

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

const sumStat = (arr, key) => arr.reduce((sum, player) => {
  if (!player || typeof player !== 'object' || !(key in player)) return sum
  return sum + (parseFloat(player[key]) || 0)
}, 0)

const formatPct = (num) => {
  const parsed = parseFloat(num)
  if (isNaN(parsed)) return ''
  return parsed === 1 ? '1.000' : parsed.toFixed(3).slice(1)
}
const formatRate = (num) => (num === '' || isNaN(num)) ? '' : parseFloat(num).toFixed(2)

const TeamPage = ({ abbr, team }) => {
  if (!team) return <div className="p-4 text-red-600">Team not found.</div>

  const bStats = batting.filter(p => p.team === abbr)
  const pStats = pitching.filter(p => p.team === abbr)
  const fStats = fielding.filter(p => p.team === abbr)

  const renderTable = (title, data, columns, formatMap = {}) => (
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
          {data.map((p, i) => (
            <tr key={i}>
              <td className="border p-1 text-left">
                <a href={`/players/${p['Player ID']}`} className="text-blue-700 underline">{p.Player}</a>
              </td>
              {columns.map(col => (
                <td key={col} className="border p-1 text-center">{formatMap[col] ? formatMap[col](p[col]) : (p[col] ?? '')}</td>
              ))}
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td className="border p-1 text-left">Total</td>
            {columns.map(col => {
              const total = sumStat(data, col)
              return <td key={col} className="border p-1 text-center">{formatMap[col] ? formatMap[col](total) : total}</td>
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
        'AVG': formatPct,
        'OBP': formatPct,
        'SLG': formatPct,
        'OPS': formatPct
      })}
      {renderTable("Pitching", pStats, [
        'W','L','W-L%','ERA','G','GS','CG','SHO','SV','IP','H','R','ER','HR','BB','IBB','SO','HBP','BK','WP','H9','HR9','BB9','SO9','SO/BB'
      ], {
        'ERA': formatRate,
        'H9': formatRate,
        'HR9': formatRate,
        'BB9': formatRate,
        'SO9': formatRate,
        'SO/BB': formatRate,
        'W-L%': formatPct
      })}
      {renderTable("Fielding", fStats, [
        'G','GS','CG','Inn','Ch','PO','A','E','DP','Fld%','PB','WP','SB','CS','CS%','PkO'
      ])}
    </div>
  )
}

export default TeamPage
