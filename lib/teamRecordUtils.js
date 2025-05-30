export function getTeamResults(schedule, abbr) {
  const results = []

  for (const game of schedule) {
    if (!game.completed) continue

    const isHome = game.home_team === abbr
    const isAway = game.away_team === abbr
    if (!isHome && !isAway) continue

    const teamScore = isHome ? game.home_score : game.away_score
    const oppScore = isHome ? game.away_score : game.home_score

    if (teamScore > oppScore) {
      results.push('W')
    } else {
      results.push('L')
    }
  }

  return results
}

export function calculateStreakAndLast10(results) {
  let streak = 0
  let streakType = ''
  for (let i = results.length - 1; i >= 0; i--) {
    if (i === results.length - 1) {
      streakType = results[i]
      streak = 1
    } else if (results[i] === streakType) {
      streak++
    } else {
      break
    }
  }

  const last10 = results.slice(-10)
  const last10W = last10.filter(r => r === 'W').length
  const last10L = last10.filter(r => r === 'L').length

  return {
    streak: `${streakType}${streak}`,
    last10: `${last10W}-${last10L}`
  }
}
