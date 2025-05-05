
import HomePage from '../components/HomePage';
import players from '../data/players.json';
import teams from '../data/teams.json';
import standings from '../data/standings.json';

export default function Home() {
  const leaders = [
    { stat: 'HR', players: players.sort((a, b) => b.hr - a.hr).slice(0, 10).map(p => ({ ...p, value: p.hr })) },
    { stat: 'AVG', players: players.sort((a, b) => b.avg - a.avg).slice(0, 10).map(p => ({ ...p, value: p.avg.toFixed(3) })) },
    { stat: 'RBI', players: players.sort((a, b) => b.rbi - a.rbi).slice(0, 10).map(p => ({ ...p, value: p.rbi })) },
    { stat: 'OPS', players: players.sort((a, b) => b.ops - a.ops).slice(0, 10).map(p => ({ ...p, value: p.ops.toFixed(3) })) }
  ];

  return <HomePage standings={standings} leaders={leaders} />;
}
