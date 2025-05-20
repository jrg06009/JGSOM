import teams from '../../data/teams.json'
import batting from '../../data/stats/batting.json'
import pitching from '../../data/stats/pitching.json'
import fielding from '../../data/stats/fielding.json'
import { useRouter } from 'next/router'
import SortableTable from '../../components/SortableTable'

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

const getBattingTotal = (players) => {
  const total = {}
  const keys = ['H','AB','BB','HBP','SF','TB']
  keys.forEach(k => total[k] = sumStat(players, k))
  total.AVG = formatPct(total.H / total.AB)
  total.OBP = formatPct((total.H + total.BB + total.HBP) / (total.AB + total.BB + total.HBP + total.SF))
  total.SLG = formatPct(total.TB / total.AB)
  total.OPS = formatPct(((total.H + total.BB + total.HBP) / (total.AB + total.BB + total.HBP + total.SF)) + (total.TB / total.AB))
  return total
}

const getPitchingTotal = (players) => {
  const total = {}
  const keys = ['W','L','ER','IP','H','HR','BB','SO']
  keys.forEach(k => total[k] = sumStat(players, k))
  const ip = parseFloat(total.IP)
  total['W-L%'] = formatPct(total.L + total.W > 0 ? total.W / (total.W + total.L) : 0)
  total.ERA = ip ? (9 * total.ER / ip).toFixed(2) : ''
  total.H9 = ip ? (9 * total.H / ip).toFixed(1) : ''
  total.HR9 = ip ? (9 * total.HR / ip).toFixed(1) : ''
  total.BB9 = ip ? (9 * total.BB / ip).toFixed(1) : ''
  total.SO9 = ip ? (9 * total.SO / ip).toFixed(1) : ''
  total['SO/BB'] = total.BB ? (total.SO / total.BB).toFixed(1) : ''
  return total
}

const TeamPage = ({ abbr, team }) => {
  if (!team) return <div className="p-4 text-red-600">Team not found.</div>

  const bStats = batting.filter(p => p.team === abbr)
  const pStats = pitching.filter(p => p.team === abbr)
  const fStats = fielding.filter(p => p.team === abbr)

  const battingKeys = [
    'G','PA','AB','R','H','2B','3B','HR','RBI','SB','CS','BB','IBB','SO','AVG','OBP','SLG','OPS','TB','GDP','HBP','SH','SF'
  ]

  const pitchingKeys = [
    'W','L','W-L%','ERA','G','GS','CG','SHO','SV','IP','H','R','ER','HR','BB','IBB','SO','HBP','BK','WP','H9','HR9','BB9','SO9','SO/BB'
  ]

  const fieldingKeys = [
    'G','GS','CG','Inn','Ch','PO','A','E','DP','Fld%','PB','WP','SB','CS','CS%','PkO'
  ]

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <img src={team.logo} alt={team.name} className="h-12 mr-4" />
        <h1 className="text-2xl font-bold" style={{ color: team.color }}>{team.name}</h1>
      </div>
      <SortableTable
        title="Batting"
        data={bStats}
        defaultSortKey="PA"
        exclude={['team']}
        columns={battingKeys}
        totalsFn={getBattingTotal}
      />
      <SortableTable
        title="Pitching"
        data={pStats}
        defaultSortKey="IP"
        exclude={['team']}
        columns={pitchingKeys}
        totalsFn={getPitchingTotal}
      />
      <SortableTable
        title="Fielding"
        data={fStats}
        defaultSortKey="G"
        exclude={['team']}
        columns={fieldingKeys}
      />
    </div>
  )
}

export default TeamPage
