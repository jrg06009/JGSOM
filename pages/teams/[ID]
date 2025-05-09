
import { useRouter } from 'next/router';
import players from '../../data/players.json';
import teams from '../../data/teams.json';

export default function TeamPage() {
  const router = useRouter();
  const { abbr } = router.query;

  const team = teams.find(t => t.id === abbr);
  const teamPlayers = players.filter(p => p.team === abbr);

  if (!team) return <div className="p-4">Team not found.</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">{team.name}</h1>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th>Player</th><th>G</th><th>AB</th><th>R</th><th>H</th>
            <th>2B</th><th>3B</th><th>HR</th><th>RBI</th><th>SB</th><th>AVG</th><th>OPS</th>
          </tr>
        </thead>
        <tbody>
          {teamPlayers.map(player => (
            <tr key={player.id} className="border-t">
              <td>{player.name}</td><td>{player.games}</td><td>{player.ab}</td><td>{player.r}</td><td>{player.h}</td>
              <td>{player['2b']}</td><td>{player['3b']}</td><td>{player.hr}</td><td>{player.rbi}</td><td>{player.sb}</td>
              <td>{player.avg}</td><td>{player.ops}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
