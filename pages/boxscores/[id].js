
import { useRouter } from 'next/router';
import boxscores from '../../data/boxscores.json';

export default function BoxscorePage() {
  const router = useRouter();
  const { id } = router.query;

  const box = boxscores.find(b => b.id === id);

  if (!box) return <div className="p-4">Boxscore not found.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-2">{box.date}: {box.away} @ {box.home}</h1>
      <p className="text-sm text-gray-600 mb-4">{box.summary || 'No summary available.'}</p>

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Line Score</h2>
        <table className="text-sm border w-full">
          <thead className="bg-gray-100">
            <tr><th></th>{box.innings.map((_, i) => <th key={i}>{i + 1}</th>)}<th>R</th><th>H</th><th>E</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{box.away}</td>
              {box.innings.map((i, idx) => <td key={idx}>{i.away}</td>)}
              <td>{box.away_total.r}</td><td>{box.away_total.h}</td><td>{box.away_total.e}</td>
            </tr>
            <tr>
              <td>{box.home}</td>
              {box.innings.map((i, idx) => <td key={idx}>{i.home}</td>)}
              <td>{box.home_total.r}</td><td>{box.home_total.h}</td><td>{box.home_total.e}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Batting Stats</h2>
        {['away_batting', 'home_batting'].map(key => (
          <div key={key} className="mb-4">
            <h3 className="font-bold">{box[key === 'away_batting' ? 'away' : 'home']}</h3>
            <table className="text-sm border w-full">
              <thead className="bg-gray-100">
                <tr><th>Player</th><th>AB</th><th>R</th><th>H</th><th>2B</th><th>3B</th><th>HR</th><th>RBI</th></tr>
              </thead>
              <tbody>
                {box[key].map(p => (
                  <tr key={p.name}>
                    <td>{p.name}</td><td>{p.ab}</td><td>{p.r}</td><td>{p.h}</td><td>{p["2b"]}</td><td>{p["3b"]}</td><td>{p.hr}</td><td>{p.rbi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h2 className="font-semibold mb-2">Pitching Stats</h2>
        {['away_pitching', 'home_pitching'].map(key => (
          <div key={key} className="mb-4">
            <h3 className="font-bold">{box[key === 'away_pitching' ? 'away' : 'home']}</h3>
            <table className="text-sm border w-full">
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
          </div>
        ))}
      </div>
    </div>
  );
}
