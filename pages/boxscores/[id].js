import fs from 'fs'
import path from 'path'
import teams from '../../data/teams.json'
import Link from 'next/link'

export async function getStaticPaths() {
  const dir = path.join(process.cwd(), 'data/boxscores')
  if (!fs.existsSync(dir)) return { paths: [], fallback: false }
  const files = fs.readdirSync(dir)
  const paths = files.map(file => ({
    params: { id: file.replace('.json', '') }
  }))
  return { paths, fallback: false }
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'data/boxscores', `${params.id}.json`)
  const raw = fs.readFileSync(filePath, 'utf8')
  const boxscore = JSON.parse(raw)
  return { props: { boxscore } }
}

const getTeamName = abbr => {
  const t = teams.find(t => t.id === abbr)
  return t?.name || abbr
}

const BoxscorePage = ({ boxscore }) => {
  if (!boxscore || !boxscore.meta || !boxscore.batting || !boxscore.pitching) {
  return <div className="p-4 text-red-600">Boxscore data missing or incomplete.</div>
}
  const { meta, batting, pitching, positions } = boxscore
  const teams = [meta.away, meta.home]

  const getPlayerLink = pid => {
  return pid ? `/players/${pid}` : '#'
}
  
  const groupBattingLines = entries => {
    return entries.map(([name, stats]) => ({
      ...stats,
      Player: name,
      POS: Array.isArray(stats.POS) ? stats.POS.join('-') : (stats.POS || "")
    }))
  }

  const positionMap = {
  '1': 'P',
  '2': 'C',
  '3': '1B',
  '4': '2B',
  '5': '3B',
  '6': 'SS',
  '7': 'LF',
  '8': 'CF',
  '9': 'RF'
};

const getPositionString = (team, player) => {
  const posSet = boxscore.positions?.[team]?.[player];
  if (!posSet) return '';
  const readable = Array.from(posSet)
    .map(p => positionMap[p] || p)
    .join('-');
  return readable;
};

  const renderBatting = team => {
    if (!batting?.[team]) return null
    const lines = groupBattingLines(Object.entries(batting[team]))
    return (
      <>
        <h3 className="font-semibold mt-4">{getTeamName(team)} Batting</h3>
        <table className="w-full text-sm border border-collapse mb-2">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-1 text-left">Player</th>
              <th className="border p-1 text-center">AB</th>
              <th className="border p-1 text-center">R</th>
              <th className="border p-1 text-center">H</th>
              <th className="border p-1 text-center">RBI</th>
              <th className="border p-1 text-center">BB</th>
              <th className="border p-1 text-center">SO</th>
              <th className="border p-1 text-center">PA</th>
              <th className="border border-l-1 border-black p-1 text-center">PO</th>
              <th className="border p-1 text-center">A</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((p, i) => {
              const pa = (p.AB || 0) + (p.BB || 0) + (p.HBP || 0) + (p.SF || 0)
              return (
                <tr key={i}>
                  <td className={`border p-1 ${(!boxscore.games_started?.[team]?.[p["Player"]] || boxscore.games_started[team][p["Player"]] === 0) ? "pl-4" : ""}`}>
                    <Link href={getPlayerLink(p["Player ID"])} className="text-blue-700 underline">
                      {p["Player"]}
                    </Link>
                    {getPositionString(team, p["Player"]) && (
                      <span className="italic"> {getPositionString(team, p["Player"])}</span>
                    )}
                  </td>
                  <td className="border p-1 text-center">{p.AB || 0}</td>
                  <td className="border p-1 text-center">{p.R || 0}</td>
                  <td className="border p-1 text-center">{p.H || 0}</td>
                  <td className="border p-1 text-center">{p.RBI || 0}</td>
                  <td className="border p-1 text-center">{p.BB || 0}</td>
                  <td className="border p-1 text-center">{p.SO || 0}</td>
                  <td className="border p-1 text-center">{pa}</td>
                  <td className="border border-l-1 border-black p-1 text-center">{p.PO || 0}</td>
                  <td className="border p-1 text-center">{p.A || 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </>
    )
  }

const renderPitching = team => {
  if (!pitching?.[team]) return null

  return (
    <>
      <h3 className="font-semibold mt-4">{getTeamName(team)} Pitching</h3>
      <table className="w-full text-sm border border-collapse mb-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left">Pitcher</th>
            <th className="border p-1 text-center">IP</th>
            <th className="border p-1 text-center">H</th>
            <th className="border p-1 text-center">R</th>
            <th className="border p-1 text-center">ER</th>
            <th className="border p-1 text-center">BB</th>
            <th className="border p-1 text-center">SO</th>
            <th className="border p-1 text-center">HR</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(pitching[team]).map((p, i) => (
            <tr key={i}>
              <td className="border p-1">
                <Link href={getPlayerLink(p["Player ID"])} className="text-blue-700 underline">
                  {p["Player"]}
                </Link>
              </td>
              <td className="border p-1 text-center">{p.IP}</td>
              <td className="border p-1 text-center">{p["H"]}</td>
              <td className="border p-1 text-center">{p["R"]}</td>
              <td className="border p-1 text-center">{p["ER"]}</td>
              <td className="border p-1 text-center">{p["BB"]}</td>
              <td className="border p-1 text-center">{p["SO"]}</td>
              <td className="border p-1 text-center">{p["HR"]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">
        {getTeamName(meta.away)} @ {getTeamName(meta.home)} —— {new Date(meta.date).toLocaleDateString()}
      </h1>
      <p className="mb-4">
        Final Score: {parseInt(meta.away_score)}–{parseInt(meta.home_score)}
      </p>
      {teams.map(t => (
        <div key={t} className="mb-8">
          {renderBatting(t)}
          {renderPitching(t)}
        </div>
      ))}
    </div>
  )
}

export default BoxscorePage
