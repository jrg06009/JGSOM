// Calculate how many games each team has played (based on completed games)
export function getTeamGamesPlayed(schedule) {
  const teamGames = {}

  for (const game of schedule) {
    if (game.home_score != null && game.away_score != null) {
      const home = game.home
      const away = game.away

      teamGames[home] = (teamGames[home] || 0) + 1
      teamGames[away] = (teamGames[away] || 0) + 1
    }
  }

  return teamGames
}
