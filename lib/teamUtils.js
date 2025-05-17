import fs from 'fs'
import path from 'path'

export function getTeamToLeagueMap() {
  const filePath = path.join(process.cwd(), 'data', 'teams.json')
  const teams = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return Object.fromEntries(teams.map(t => [t.id, t.league]))
}

export function getTeamGamesPlayedMap(stats, posField = 'POS') {
  const map = {};
  for (const row of stats) {
    const team = row.team;
    if (!row[posField]) continue; // skip if no position

    if (!map[team]) map[team] = new Set();
    map[team].add(row["Game#"]);
  }
  // Convert sets to counts
  for (const team in map) {
    map[team] = map[team].size;
  }
  return map;
}
