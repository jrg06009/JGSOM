
import games from '../data/games.json';
import Link from 'next/link';

export default function SchedulePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">1999 Schedule</h1>
      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Away</th>
            <th className="text-left p-2">Home</th>
            <th className="text-left p-2">Result</th>
            <th className="text-left p-2">Boxscore</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => (
            <tr key={game.id} className="border-t">
              <td className="p-2">{game.date}</td>
              <td className="p-2">{game.away}</td>
              <td className="p-2">{game.home}</td>
              <td className="p-2">{game.result}</td>
              <td className="p-2">
                {game.boxscoreId ? (
                  <Link href={`/boxscores/${game.boxscoreId}`} className="text-blue-600 hover:underline">View</Link>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
