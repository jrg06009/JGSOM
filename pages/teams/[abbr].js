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

const TeamPage = ({ abbr, team }) => {
  if (!team) return <div className="p-4 text-red-600">Team not found.</div>

  const bStats = batting.filter(p => p.team === abbr)
  const pStats = pitching.filter(p => p.team === abbr)
  const fStats = fielding.filter(p => p.team === abbr)

  const battingKeys = [
    'G','PA','AB','R','H','2B','3B','HR','RBI','SB','CS','BB','IBB','SO',
    'AVG','OBP','SLG','OPS','TB','GDP','HBP','SH','SF'
  ]
  const battingFormats = {
    AVG: formatPct,
    OBP: formatPct,
    SLG: formatPct,
    OPS: formatPct
  }

  const pitchingKeys = [
    'W','L','W-L%','ERA','G','GS','CG','SHO','SV','IP','H','R','ER','HR','BB','IBB','SO','HBP','BK','WP','H9','HR9','BB9','SO9','SO/BB'
  ]
  const pitchingFormats = {
    'ERA': formatRate,
    'W-L%': formatPct,
    'H9': formatRate,
    'HR9': formatRate,
    'BB9': formatRate,
    'SO9': formatRate,
    'SO/BB': formatRate
  }

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
        columnFormats={battingFormats}
        showTotals={true}
      />
      <SortableTable
        title="Pitching"
        data={pStats}
        defaultSortKey="IP"
        exclude={['team']}
        columns={pitchingKeys}
        columnFormats={pitchingFormats}
        showTotals={true}
      />
      <SortableTable
        title="Fielding"
        data={fStats}
        defaultSortKey="G"
        exclude={['team']}
        columns={fieldingKeys}
        showTotals={true}
      />
    </div>
  )
}

export default TeamPage
