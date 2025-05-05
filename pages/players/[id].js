
import { useRouter } from 'next/router';
import players from '../../data/players.json';

export default function PlayerPage() {
  const router = useRouter();
  const { id } = router.query;

  const player = players.find(p => p.id === id);

  if (!player) return <div className="p-4">Player not found.</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-2">{player.name}</h1>
      <p className="text-gray-600 mb-4">Team: {player.team} | Position: {player.position}</p>
      <table className="text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th>G</th><th>PA</th><th>AB</th><th>R</th><th>H</th>
            <th>2B</th><th>3B</th><th>HR</th><th>RBI</th><th>SB</th><th>AVG</th><th>OPS</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td>{player.games}</td><td>{player.pa}</td><td>{player.ab}</td><td>{player.r}</td><td>{player.h}</td>
            <td>{player['2b']}</td><td>{player['3b']}</td><td>{player.hr}</td><td>{player.rbi}</td><td>{player.sb}</td>
            <td>{player.avg}</td><td>{player.ops}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
