export function sum(stats, key) {
  return stats.reduce((acc, obj) => acc + (parseFloat(obj[key]) || 0), 0)
}

export function calculateBattingTotals(players) {
  const total = {}
  for (const key of Object.keys(players[0] || {})) {
    if (key !== 'Player' && key !== 'Player ID') total[key] = sum(players, key)
  }
  const { H = 0, AB = 0, BB = 0, HBP = 0, SF = 0, TB = 0 } = total
  const OBP = (H + BB + HBP) / (AB + BB + HBP + SF || 1)
  const SLG = TB / (AB || 1)
  return {
    Player: 'Total',
    ...total,
    AVG: (H / (AB || 1)).toFixed(3),
    OBP: OBP.toFixed(3),
    SLG: SLG.toFixed(3),
    OPS: (OBP + SLG).toFixed(3)
  }
}

export function calculatePitchingTotals(players, teamId, schedule) {
  const total = {}
  for (const key of Object.keys(players[0] || {})) {
    if (key !== 'Player' && key !== 'Player ID') total[key] = sum(players, key)
  }
  const { W = 0, L = 0, BB = 0, H = 0, IP = 0, SO = 0, HR = 0 } = total
  const games = W + L
  const SHO = schedule.filter(game => {
    const isHome = game.home === teamId
    const isAway = game.away === teamId
    const opponentRuns = isHome ? game.away_score : isAway ? game.home_score : null
    return opponentRuns === 0
  }).length

  return {
    Player: 'Total',
    ...total,
    SHO,
    'W-L%': ((W / (games || 1)).toFixed(3)),
    WHIP: ((BB + H) / (IP || 1)).toFixed(2),
    H9: ((H * 9) / (IP || 1)).toFixed(2),
    BB9: ((BB * 9) / (IP || 1)).toFixed(2),
    SO9: ((SO * 9) / (IP || 1)).toFixed(2),
    'SO/BB': (SO / (BB || 1)).toFixed(2),
    HR9: ((HR * 9) / (IP || 1)).toFixed(2)
  }
}

export function calculateFieldingTotals(players) {
  const total = {}
  for (const key of Object.keys(players[0] || {})) {
    if (key !== 'Player' && key !== 'Player ID') total[key] = sum(players, key)
  }
  const { PO = 0, A = 0, E = 0, CS = 0, SB = 0 } = total
  return {
    Player: 'Total',
    ...total,
    'Fld Pct': ((PO + A) / (PO + A + E || 1)).toFixed(3),
    'CS%': (CS / (CS + SB || 1)).toFixed(3)
  }
}
