import { useRouter } from 'next/router'
import batting from '../../data/stats/batting.json'
import pitching from '../../data/stats/pitching.json'
import fielding from '../../data/stats/fielding.json'
import fieldingByPosition from '../../data/stats/fielding_by_position.json'
import playerPhotos from '../../data/player_photos.json'
import battingLog from '../../data/stats/batting_log.json'
import Link from 'next/link'

const positionMap = {
  '1': 'P', '2': 'C', '3': '1B', '4': '2B', '5': '3B',
  '6': 'SS', '7': 'LF', '8': 'CF', '9': 'RF'
}

const sumStat = (arr, key) => arr.reduce((sum, p) => sum + (parseFloat(p[key]) || 0), 0)
const sumIP = arr => arr.reduce((sum, p) => {
  const val = p["IP"]
  if (!val) return sum
  const [whole, frac] = val.split(".").map(Number)
  const thirds = frac === 2 ? 2 : frac === 1 ? 1 : 0
  return sum + whole + thirds / 3
}, 0)
const formatPct = num => isNaN(num) ? '' : num === 1 ? '1.000' : num.toFixed(3).replace(/^0\./, '.')
const formatRate = num => isNaN(num) ? '' : num.toFixed(2).replace(/^0\./, '.')
const formatIP = num => {
  const whole = Math.floor(num)
  const decimal = num - whole
  if (Math.abs(decimal - 2 / 3) < 0.01) return `${whole}.2`
  if (Math.abs(decimal - 1 / 3) < 0.01) return `${whole}.1`
  return `${whole}`
}

const renderTable = (title, stats, keys, format = {}) => (
  <div className="mb-8">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <table className="w-full text-sm border border-collapse">
      <thead>
        <tr className="bg-gray-100">
          {Object.keys(stats[0] || {}).map(k => keys.includes(k) && (
            <th key={k} className="border p-1 text-center">
              {k === 'team' ? 'Team' : k}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {stats.map((row, i) => (
          <tr key={i}>
            {keys.map(k => (
              <td key={k} className="border p-1 text-center">
                {k === 'team' ? (
                  <Link href={`/teams/${row[k]}`}>
                    <a className="text-blue-600 hover:underline">{row[k]}</a>
                  </Link>
                ) : (
                  format[k] && row[k] !== '' && row[k] !== undefined && !isNaN(row[k])
                    ? format[k](Number(row[k]))
                      : row[k]
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export default function PlayerPage() {
  const router = useRouter()
  const { id } = router.query
  if (!id) return <div className="p-4 text-red-600">Invalid Player ID</div>

  const bat = batting.filter(p => p['Player ID'] === id)
  const pit = pitching.filter(p => p['Player ID'] === id)
  const fld = fielding.filter(p => p['Player ID'] === id)
  const fldPos = fieldingByPosition.filter(p => p['Player ID'] === id)

  const name = bat[0]?.Player || pit[0]?.Player || fld[0]?.Player || fldPos[0]?.Player
  if (!name) return <div className="p-4 text-red-600">Player not found.</div>

  const playerPhotoData = playerPhotos[id] || []
  const lastTeam = bat.at(-1)?.team || pit.at(-1)?.team || fld.at(-1)?.team
  const photoUrl = playerPhotoData.find(p => p.team === lastTeam)?.url || null
  const otherPhotos = playerPhotoData

  const posMap = pos => positionMap[pos] || pos
  const posSorted = fldPos.sort((a, b) => parseInt(a.POS) - parseInt(b.POS))

    // Group by position
  const groupedByPosition = fldPos.reduce((acc, current) => {
    const position = posMap(current.POS);
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(current);
    return acc;
  }, {});

  return (
    <div className="p-4">
      <div className="mb-6 flex items-center gap-4">    
        {photoUrl && (
          <div className="mb-4 relative group w-36 h-36 flex-shrink-0">
            <img
              src={photoUrl}
              alt={`${name} (${lastTeam})`}
              className="rounded shadow w-full h-full object-cover"
            />
            {Object.keys(otherPhotos).length > 1 && (
              <div className="absolute hidden group-hover:flex flex-wrap gap-1 top-full mt-2 z-10 bg-white border p-2 shadow-lg">
                {Object.entries(otherPhotos).map(([team, url]) => (
                  team !== lastTeam && (
                    <img
                      key={team}
                      src={url}
                      alt={`${name} (${team})`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  )
                ))}
              </div>
            )}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold mb-4">{name}</h1>
          <div className="mb-4 space-x-4">
            {bat.length > 0 && (
              <Link href={`/players/${id}/gamelog`}>
                <a className="text-blue-600 underline hover:text-blue-800">View Batting Game Log</a>
              </Link>
            )}
            {pit.length > 0 && (
              <Link href={`/players/${id}/PitchingGameLog`}>
                <a className="text-blue-600 underline hover:text-blue-800">View Pitching Game Log</a>
              </Link>
            )}
          </div>
        </div>
      </div>
      {bat.length > 0 && renderTable("Batting", bat, [
         'team','G','PA','AB','R','H','2B','3B','HR','RBI','SB','CS','BB','IBB','SO','AVG','OBP','SLG','OPS','TB','GDP','HBP','SH','SF'
       ])}
       {pit.length > 0 && renderTable("Pitching", pit, [
         'team','W','L','W-L%','ERA','G','GS','CG','SHO','SV','IP','H','R','ER','HR','BB','IBB','SO','HBP','BK','WP','H9','HR9','BB9','SO9','SO/BB'
       ], {
         'ERA': formatRate, 'W-L%': formatPct, 'H9': formatRate, 'HR9': formatRate, 'BB9': formatRate, 'SO9': formatRate, 'SO/BB': formatRate
       })}
       {fld.length > 0 && renderTable("Fielding Totals", fld, [
         'team','G','GS','CG','Inn','Ch','PO','A','E','DP','Fld%','PB','SB','CS','CS%','PkO'
       ])}
       {/* Render a table for each position */}
       {Object.keys(groupedByPosition).map(position => {
         const positionData = groupedByPosition[position];
         if (positionData.length === 0) return null;
         const baseCols = ['team', 'G', 'GS', 'CG', 'Inn', 'Ch', 'PO', 'A', 'E', 'DP', 'Fld%'];
         const colsForCatchers = ['PB', 'SB', 'CS', 'CS%'];
         const colsForPitchers = ['SB', 'CS', 'CS%', 'PkO'];
  
         let extraCols = [];
         if (position === 'C') extraCols = colsForCatchers;
         else if (position === 'P') extraCols = colsForPitchers;
          const allCols = [...baseCols, ...extraCols];
          return renderTable(`Fielding-${position}`, positionData, allCols);
       })}
     </div>
  );
}
