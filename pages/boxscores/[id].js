
import { useRouter } from 'next/router';
import boxscores from '../../data/boxscores.json';

const teamColors = {
  ARI: '#A71930', ATL: '#CE1141', BAL: '#DF4601', BOS: '#BD3039', CHC: '#0E3386',
  CIN: '#C6011F', CLE: '#0C2340', COL: '#33006F', DET: '#0C2340', HOU: '#EB6E1F',
  KCR: '#004687', LAA: '#BA0021', LAD: '#005A9C', MIA: '#00A3E0', MIL: '#12284B',
  MIN: '#002B5C', NYM: '#002D72', NYY: '#003087', OAK: '#003831', PHI: '#E81828',
  PIT: '#FDB827', SDP: '#002D62', SEA: '#0C2C56', SFG: '#FD5A1E', STL: '#C41E3A',
  TBR: '#092C5C', TEX: '#003278', TOR: '#134A8E', WSN: '#AB0003'
};

export default function BoxscorePage() {
  const router = useRouter();
  const { id } = router.query;
  const box = boxscores.find(b => b.id === id);
  if (!box) return <div className="p-4">Boxscore not found.</div>;

  const sumStats = (players, stat) => players?.reduce((acc, p) => acc + (p[stat] || 0), 0);
  const headerStyle = (abbr) => ({
    backgroundColor: teamColors[abbr] || '#e5e7eb',
    color: '#ffffff'
  });

  const renderBattingTable = (players, abbr) => (
    <table className="text-sm w-full mb-2 border border-gray-300">
      <thead style={headerStyle(abbr)}>
        <tr>
          <th className="border border-gray-300 px-2 py-1">Player</th>
          <th className="border border-gray-300 px-2 py-1">AB</th>
          <th className="border border-gray-300 px-2 py-1">R</th>
          <th className="border border-gray-300 px-2 py-1">H</th>
          <th className="border border-gray-300 px-2 py-1">HR</th>
          <th className="border border-gray-300 px-2 py-1">RBI</th>
        </tr>
      </thead>
      <tbody>
        {players.map(p => (
          <tr key={p.name}>
            <td className="border border-gray-200 px-2 py-1">{p.name}</td>
            <td className="border border-gray-200 px-2 py-1">{p.ab}</td>
            <td className="border border-gray-200 px-2 py-1">{p.r}</td>
            <td className="border border-gray-200 px-2 py-1">{p.h}</td>
            <td className="border border-gray-200 px-2 py-1">{p.hr}</td>
            <td className="border border-gray-200 px-2 py-1">{p.rbi}</td>
          </tr>
        ))}
        <tr className="font-bold">
          <td className="border border-gray-300 px-2 py-1">Total</td>
          <td className="border border-gray-300 px-2 py-1">{sumStats(players, 'ab')}</td>
          <td className="border border-gray-300 px-2 py-1">{sumStats(players, 'r')}</td>
          <td className="border border-gray-300 px-2 py-1">{sumStats(players, 'h')}</td>
          <td className="border border-gray-300 px-2 py-1">{sumStats(players, 'hr')}</td>
          <td className="border border-gray-300 px-2 py-1">{sumStats(players, 'rbi')}</td>
        </tr>
      </tbody>
    </table>
  );

  const renderPitchingTable = (players, abbr) => (
    <table className="text-sm w-full mb-2 border border-gray-300">
      <thead style={headerStyle(abbr)}>
        <tr>
          <th className="border border-gray-300 px-2 py-1">Pitcher</th>
          <th className="border border-gray-300 px-2 py-1">IP</th>
          <th className="border border-gray-300 px-2 py-1">H</th>
          <th className="border border-gray-300 px-2 py-1">R</th>
          <th className="border border-gray-300 px-2 py-1">ER</th>
          <th className="border border-gray-300 px-2 py-1">BB</th>
          <th className="border border-gray-300 px-2 py-1">SO</th>
          <th className="border border-gray-300 px-2 py-1">HR</th>
          <th className="border border-gray-300 px-2 py-1">WLS</th>
        </tr>
      </thead>
      <tbody>
        {players.map(p => (
          <tr key={p.name}>
            <td className="border border-gray-200 px-2 py-1">{p.name}</td>
            <td className="border border-gray-200 px-2 py-1">{p.ip}</td>
            <td className="border border-gray-200 px-2 py-1">{p.h}</td>
            <td className="border border-gray-200 px-2 py-1">{p.r}</td>
            <td className="border border-gray-200 px-2 py-1">{p.er}</td>
            <td className="border border-gray-200 px-2 py-1">{p.bb}</td>
            <td className="border border-gray-200 px-2 py-1">{p.so}</td>
            <td className="border border-gray-200 px-2 py-1">{p.hr}</td>
            <td className="border border-gray-200 px-2 py-1">{p.wls}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{box.date}: {box.away} @ {box.home}</h1>
      <p className="mb-6 text-sm text-gray-600">Final: {box.away_score}–{box.home_score}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">{box.away}</h2>
          <h3 className="text-md font-medium mb-1">Batting</h3>
          {box.away_batting?.length ? renderBattingTable(box.away_batting, box.away) : <p>No batting data.</p>}
          <hr className="my-2" />
          <h3 className="text-md font-medium mb-1">Pitching</h3>
          {box.away_pitching?.length ? renderPitchingTable(box.away_pitching, box.away) : <p>No pitching data.</p>}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">{box.home}</h2>
          <h3 className="text-md font-medium mb-1">Batting</h3>
          {box.home_batting?.length ? renderBattingTable(box.home_batting, box.home) : <p>No batting data.</p>}
          <hr className="my-2" />
          <h3 className="text-md font-medium mb-1">Pitching</h3>
          {box.home_pitching?.length ? renderPitchingTable(box.home_pitching, box.home) : <p>No pitching data.</p>}
        </div>
      </div>
    </div>
  );
}
