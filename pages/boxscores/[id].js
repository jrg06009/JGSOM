
import { useRouter } from 'next/router';
import boxscores from '../../data/boxscores.json';

export default function BoxscorePage() {
  const router = useRouter();
  const { id } = router.query;

  const box = boxscores.find(b => b.id === id);
  if (!box) return <div className="p-4">Boxscore not found.</div>;

  const sumStats = (players, stat) => players?.reduce((acc, p) => acc + (p[stat] || 0), 0);

  const renderBatting = (players) => (
    <table className="text-sm border w-full mb-2">
      <thead className="bg-gray-100">
        <tr><th>Player</th><th>AB</th><th>R</th><th>H</th><th>HR</th><th>RBI</th></tr>
      </thead>
      <tbody>
        {players.map(p => (
          <tr key={p.name}>
            <td>{p.name}</td><td>{p.ab}</td><td>{p.r}</td><td>{p.h}</td><td>{p.hr}</td><td>{p.rbi}</td>
          </tr>
        ))}
        <tr className="font-bold border-t">
          <td>Total</td>
          <td>{sumStats(players, 'ab')}</td>
          <td>{sumStats(players, 'r')}</td>
          <td>{sumStats(players, 'h')}</td>
          <td>{sumStats(players, 'hr')}</td>
          <td>{sumStats(players, 'rbi')}</td>
        </tr>
      </tbody>
    </table>
  );

  const renderPitching = (players) => (
    <table className="text-sm border w-full mb-2">
      <thead className="bg-gray-100">
        <tr><th>Pitcher</th><th>IP</th><th>H</th><th>R</th><th>ER</th><th>BB</th><th>SO</th><th>HR</th><th>WLS</th></tr>
      </thead>
      <tbody>
        {players.map(p => (
          <tr key={p.name}>
            <td>{p.name}</td><td>{p.ip}</td><td>{p.h}</td><td>{p.r}</td><td>{p.er}</td>
            <td>{p.bb}</td><td>{p.so}</td><td>{p.hr}</td><td>{p.wls}</td>
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
        {/* Away Column */}
        <div>
          <h2 className="text-lg font-semibold mb-2">{box.away} Batting</h2>
          {box.away_batting?.length ? renderBatting(box.away_batting) : <p>No batting data.</p>}
          <hr className="my-2" />
          <h2 className="text-lg font-semibold mb-2">{box.away} Pitching</h2>
          {box.away_pitching?.length ? renderPitching(box.away_pitching) : <p>No pitching data.</p>}
        </div>

        {/* Home Column */}
        <div>
          <h2 className="text-lg font-semibold mb-2">{box.home} Batting</h2>
          {box.home_batting?.length ? renderBatting(box.home_batting) : <p>No batting data.</p>}
          <hr className="my-2" />
          <h2 className="text-lg font-semibold mb-2">{box.home} Pitching</h2>
          {box.home_pitching?.length ? renderPitching(box.home_pitching) : <p>No pitching data.</p>}
        </div>
      </div>
    </div>
  );
}
