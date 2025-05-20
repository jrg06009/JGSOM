import teams from '../../data/teams.json'
import batting from '../../data/stats/batting.json'
import pitching from '../../data/stats/pitching.json'
import fielding from '../../data/stats/fielding.json'
import { useRouter } from 'next/router'
import Link from 'next/link'

const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

export async function getStaticPaths() {
  const paths = teams.map(t => ({
    params: { abbr: t.id }
  }))

  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  const fs = (await import('fs')).default
  const path = (await import('path')).default
  const filePath = path.join(process.cwd(), 'data', 'teams.json')
  const teamsRaw = fs.readFileSync(filePath, 'utf8')
  const teamsData = JSON.parse(teamsRaw)
  const team = teamsData.find(t => t.id === params.abbr)

  return {
    props: {
      abbr: params.abbr,
      team,
      batting,
      pitching,
      fielding
    }
  }
}

const sumStat = (arr, field) => arr.reduce((sum, p) => sum + (parseFloat(p[field]) || 0), 0)
const formatPct = (num) => (num === 1 ? '1.000' : num ? num.toFixed(3).slice(1) : '')
const formatRate = (num) => (num === '' || isNaN(num)) ? '' : `${num}`

const StatTable = ({ title, players, columns }) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <table className="w-full text-sm border border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="border p-1 text-left">Player</th>
          {columns.map(col => (
            <th key={col.key} className="border p-1 text-center">{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((p, i) => (
          <tr key={i}>
            <td className="border p-1 text-left">
              <Link href={`/players/${p['Player ID']}`} className="text-blue-700 underline">{p.Player}</Link>
            </td>
            {columns.map(col => (
              <td key={col.key} className="border p-1 text-center">{p[col.key] ?? ''}</td>
            ))}
          </tr>
        ))}
        <tr className="font-bold bg-gray-50">
          <td className="border p-1 text-left">Total</td>
          {columns.map(col => {
            const total = col.totalFn ? col.totalFn(players, col.key) : sumStat(players, col.key)
            return <td key={col.key} className="border p-1 text-center">{col.format ? col.format(total) : total}</td>
          })}
        </tr>
      </tbody>
    </table>
  </div>
)

const TeamPage = ({ abbr, team, batting, pitching, fielding }) => {
  if (!team) return <div className="p-4 text-red-600">Team not found.</div>

  const teamBatting = batting.filter(p => p.team === abbr)
  const teamPitching = pitching.filter(p => p.team === abbr)
  const teamFielding = fielding.filter(p => p.team === abbr)

  const battingCols = [
    { key: 'G', label: 'G' }, { key: 'PA', label: 'PA' }, { key: 'AB', label: 'AB' },
    { key: 'R', label: 'R' }, { key: 'H', label: 'H' }, { key: '2B', label: '2B' },
    { key: '3B', label: '3B' }, { key: 'HR', label: 'HR' }, { key: 'RBI', label: 'RBI' },
    { key: 'SB', label: 'SB' }, { key: 'CS', label: 'CS' }, { key: 'BB', label: 'BB' },
    { key: 'SO', label: 'SO' },
    { key: 'AVG', label: 'AVG', totalFn: (arr) => sumStat(arr, 'H') / sumStat(arr, 'AB'), format: formatPct },
    { key: 'OBP', label: 'OBP', totalFn: (arr) => {
      const H = sumStat(arr, 'H'), BB = sumStat(arr, 'BB'), HBP = sumStat(arr, 'HBP'), AB = sumStat(arr, 'AB'), SF = sumStat(arr, 'SF')
      return (H + BB + HBP) / (AB + BB + HBP + SF)
    }, format: formatPct },
    { key: 'SLG', label: 'SLG', totalFn: (arr) => sumStat(arr, 'TB') / sumStat(arr, 'AB'), format: formatPct },
    { key: 'OPS', label: 'OPS', totalFn: (arr) => {
      const obp = (sumStat(arr, 'H') + sumStat(arr, 'BB') + sumStat(arr, 'HBP')) / (sumStat(arr, 'AB') + sumStat(arr, 'BB') + sumStat(arr, 'HBP') + sumStat(arr, 'SF'))
      const slg = sumStat(arr, 'TB') / sumStat(arr, 'AB')
      return obp + slg
    }, format: formatPct }
  ]

  const pitchingCols = [
    { key: 'W', label: 'W' }, { key: 'L', label: 'L' }, { key: 'ERA', label: 'ERA' },
    { key: 'G', label: 'G' }, { key: 'GS', label: 'GS' }, { key: 'CG', label: 'CG' },
    { key: 'SHO', label: 'SHO' }, { key: 'SV', label: 'SV' }, { key: 'IP', label: 'IP' },
    { key: 'H', label: 'H' }, { key: 'R', label: 'R' }, { key: 'ER', label: 'ER' },
    { key: 'HR', label: 'HR' }, { key: 'BB', label: 'BB' }, { key: 'IBB', label: 'IBB' },
    { key: 'SO', label: 'SO' }, { key: 'HBP', label: 'HBP' }, { key: 'BK', label: 'BK' },
    { key: 'WP', label: 'WP' }, { key: 'H9', label: 'H9' }, { key: 'HR9', label: 'HR9' },
    { key: 'BB9', label: 'BB9' }, { key: 'SO9', label: 'SO9' }, { key: 'SO/BB', label: 'SO/BB' }
  ]

  const fieldingCols = [
    { key: 'G', label: 'G' }, { key: 'GS', label: 'GS' }, { key: 'CG', label: 'CG' },
    { key: 'Inn', label: 'Inn' }, { key: 'Ch', label: 'Ch' }, { key: 'PO', label: 'PO' },
    { key: 'A', label: 'A' }, { key: 'E', label: 'E' }, { key: 'DP', label: 'DP' },
    { key: 'Fld%', label: 'Fld%' }, { key: 'PB', label: 'PB' }, { key: 'WP', label: 'WP' },
    { key: 'SB', label: 'SB' }, { key: 'CS', label: 'CS' }, { key: 'CS%', label: 'CS%' }, { key: 'PkO', label: 'PkO' }
  ]

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <img src={team.logo} alt={team.name} className="h-12 mr-4" />
        <h1 className="text-2xl font-bold" style={{ color: team.color }}>{team.name}</h1>
      </div>
      <StatTable title="Batting" players={teamBatting} columns={battingCols} />
      <StatTable title="Pitching" players={teamPitching} columns={pitchingCols} />
      <StatTable title="Fielding" players={teamFielding} columns={fieldingCols} />
    </div>
  )
}

export default TeamPage
