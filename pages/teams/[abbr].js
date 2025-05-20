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

const calcTotal = {
  AVG: (arr) => formatPct(sumStat(arr, 'H') / sumStat(arr, 'AB')),
  OBP: (arr) => formatPct((sumStat(arr, 'H') + sumStat(arr, 'BB') + sumStat(arr, 'HBP')) / (sumStat(arr, 'AB') + sumStat(arr, 'BB') + sumStat(arr, 'HBP') + sumStat(arr, 'SF'))),
  SLG: (arr) => formatPct(sumStat(arr, 'TB') / sumStat(arr, 'AB')),
  OPS: (arr) => {
    const obp = (sumStat(arr, 'H') + sumStat(arr, 'BB') + sumStat(arr, 'HBP')) / (sumStat(arr, 'AB') + sumStat(arr, 'BB') + sumStat(arr, 'HBP') + sumStat(arr, 'SF'))
    const slg = sumStat(arr, 'TB') / sumStat(arr, 'AB')
    return formatPct(obp + slg)
  },
  ERA: (arr) => formatRate((sumStat(arr, 'ER') * 9) / sumStat(arr, 'IP')),
  'W-L%': (arr) => {
    const w = sumStat(arr, 'W')
    const l = sumStat(arr, 'L')
    if (w + l === 0) return ''
    return formatPct(w / (w + l))
  },
  H9: (arr) => formatRate(sumStat(arr, 'H') * 9 / sumStat(arr, 'IP')),
  HR9: (arr) => formatRate(sumStat(arr, 'HR') * 9 / sumStat(arr, 'IP')),
  BB9: (arr) => formatRate(sumStat(arr, 'BB') * 9 / sumStat(arr, 'IP')),
  SO9: (arr) => formatRate(sumStat(arr, 'SO') * 9 / sumStat(arr, 'IP')),
  'SO/BB': (arr) => formatRate(sumStat(arr, 'SO') / sumStat(arr, 'BB')),
  Fld%: (arr) => {
    const po = sumStat(arr, 'PO')
    const a = sumStat(arr, 'A')
    const e = sumStat(arr, 'E')
    const ch = po + a + e
    if (!ch) return ''
    const pct = (po + a) / ch
    return pct === 1 ? '1.000' : pct.toFixed(3).slice(1)
  },
  'CS%': (arr) => {
    const cs = sumStat(arr, 'CS')
    const sb = sumStat(arr, 'SB')
    const attempts = sb + cs
    if (!attempts) return ''
    return `${Math.round((cs / attempts) * 100)}%`
  }
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
        totals={calcTotal}
      />
      <SortableTable
        title="Pitching"
        data={pStats}
        defaultSortKey="IP"
        exclude={['team']}
        columns={pitchingKeys}
        totals={calcTotal}
      />
      <SortableTable
        title="Fielding"
        data={fStats}
        defaultSortKey="G"
        exclude={['team']}
        columns={fieldingKeys}
        totals={calcTotal}
      />
    </div>
  )
}

export default TeamPage
