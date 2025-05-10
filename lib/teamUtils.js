import fs from 'fs'
import path from 'path'

export function getTeamToLeagueMap() {
  const filePath = path.join(process.cwd(), 'data', 'stats', 'teams.json')
  const teams = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return Object.fromEntries(teams.map(t => [t.id, t.league]))
}
