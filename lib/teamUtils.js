import fs from 'fs'
import path from 'path'

export function getTeamToLeagueMap() {
  const filePath = path.join(process.cwd(), 'data', 'teams.json')
  const teams = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  return Object.fromEntries(teams.map(t => [t.id, t.league]))
}

export function getTeamGamesPlayedFromSchedule(schedule) {
  const teamGames = {}

  for (const game of schedule) {
    if (!game.completed) continue

    const { home_team, away_team } = game
    teamGames[home_team] = (teamGames[home_team] || 0) + 1
    teamGames[away_team] = (teamGames[away_team] || 0) + 1
  }

  return teamGames
}

