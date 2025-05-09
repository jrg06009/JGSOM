
import React from 'react';
import Link from 'next/link';

export default function HomePage({ standings, leaders }) {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">1999 Strat-O-Matic Season</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Division Standings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {standings.map((division) => (
            <div key={division.division} className="border rounded-xl p-3 bg-white shadow">
              <h3 className="font-bold mb-2 text-lg">{division.division}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Team</th>
                    <th>W</th>
                    <th>L</th>
                    <th>GB</th>
                  </tr>
                </thead>
                <tbody>
                  {division.teams.map((team) => (
                    <tr key={team.abbr} className="border-t">
                      <td><Link href={`/teams/${team.ID}`}>{team.name}</Link></td>
                      <td className="text-center">{team.w}</td>
                      <td className="text-center">{team.l}</td>
                      <td className="text-center">{team.gb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">League Leaders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leaders.map((category) => (
            <div key={category.stat} className="border rounded-xl p-3 bg-white shadow">
              <h3 className="font-bold text-lg mb-2">Top {category.stat}</h3>
              <ul>
                {category.players.map((player, index) => (
                  <li key={player.id} className="flex justify-between text-sm border-b py-1">
                    <span>{index + 1}. <Link href={`/players/${player.id}`} className="text-blue-600 hover:underline">{player.name} ({player.team})</Link></span>
                    <span>{player.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
