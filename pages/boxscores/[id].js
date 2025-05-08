import { useRouter } from 'next/router';
import boxscores from '../../data/boxscores.json';

export default function BoxscorePage() {
  const router = useRouter();
  const { id } = router.query;

  const box = boxscores.find(b => b.id === id);
  if (!box) return <div className="p-4">Boxscore not found.</div>;

  const sumStats = (players, stat) => players?.reduce((acc, p) => acc + (p[stat] || 0), 0);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">{box.date}: {box.away} @ {box.home}</h1>
      <p className="mb-4 text-sm text-gray-600">Final: {box.away_score}–{box.home_score}</p>

      {/* Batting Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Batting</h2>
        {[['away_batting', box.away], ['home_batting', box.home]].map(([key, team]) => (
          <div key={team} className="mb-4">
            <h3 className="font-bold text-md mb-1">{team}</h3>
            {box[key]?.length ? (
              <table className="text-sm border w-full mb-2">
                <thead className="bg-gray-100">
                  <tr><th>Player</th><th>AB</th><th>R</th><th>H</th><th>HR</th><th>RBI</th></tr>
                </thead>
                <tbody>
                  {box[key].map(p => (
                    <tr key={p.name}>
                      <td>{p.name}</td><td>{p.ab}</td><td>{p.r}</td><td>{p.h}</td><td>{p.hr}</td><td>{p.rbi}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t">
                    <td>Total</td>
                    <td>{sumStats(box[key], 'ab')}</td>
                    <td>{sumStats(box[key], 'r')}</td>
                    <td>{sumStats(box[key], 'h')}</td>
                    <td>{sumStats(box[key], 'hr')}</td>
                    <td>{sumStats(box[key], 'rbi')}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="italic text-gray-500">No batting data available.</p>
            )}
          </div>
        ))}
      </div>

      {/* Pitching Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Pitching</h2>
        {[['away_pitching', box.away], ['home_pitching', box.home]].map(([key, team]) => (
          <div key={team} className="mb-4">
            <h3 className="font-bold text-md mb-1">{team}</h3>
            {box[key]?.length ? (
              <table className="text-sm border w-full mb-2">
                <thead className="bg-gray-100">
                  <tr><th>Pitcher</th><th>IP</th><th>H</th><th>R</th><th>ER</th><th>BB</th><th>SO</th><th>HR</th><th>WLS</th></tr>
                </thead>
                <tbody>
                  {box[key].map(p => (
                    <tr key={p.name}>
                      <td>{p.name}</td><td>{p.ip}</td><td>{p.h}</td><td>{p.r}</td><td>{p.er}</td>
                      <td>{p.bb}</td><td>{p.so}</td><td>{p.hr}</td><td>{p.wls}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="italic text-gray-500">No pitching data available.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
