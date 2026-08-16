import { displayName } from './parseExcel'

/**
 * Generate all combinations of size r from array arr.
 */
export function combinations(arr, r) {
  const result = []
  const combo = []

  function backtrack(start) {
    if (combo.length === r) {
      result.push([...combo])
      return
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i])
      backtrack(i + 1)
      combo.pop()
    }
  }

  backtrack(0)
  return result
}

/**
 * Build a normalized data model from raw rows:
 * - rows: array of { team, player, position }
 * Returns { rows, uniquePlayers, teamNames, positionLookup, playerLookup }
 */
export function buildDataModel(rawRows) {
  const rows = rawRows.map((r) => ({
    team: String(r.team).trim(),
    player: String(r.player).trim(),
    position: String(r.position).toUpperCase().trim(),
  }))

  const uniquePlayers = [...new Set(rows.map((r) => r.player))].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  )

  const teamNames = [...new Set(rows.map((r) => r.team))].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  )

  // position lookup: first position found per player
  const positionLookup = {}
  for (const r of rows) {
    if (!(r.player in positionLookup)) {
      positionLookup[r.player] = r.position
    }
  }

  // lower-case -> canonical player name
  const playerLookup = {}
  for (const p of uniquePlayers) {
    playerLookup[p.toLowerCase()] = p
  }

  return { rows, uniquePlayers, teamNames, positionLookup, playerLookup }
}

/**
 * Get rows for a given team.
 */
export function getTeamRows(rows, team) {
  return rows.filter((r) => r.team === team)
}

/**
 * Get rows for a given player (case-insensitive).
 */
export function getPlayerRows(rows, player) {
  return rows.filter(
    (r) => r.player.toLowerCase() === player.toLowerCase(),
  )
}

/**
 * Get the set of lower-case player names on a team.
 */
export function getTeamPlayerSet(rows, team) {
  return new Set(
    rows.filter((r) => r.team === team).map((r) => r.player.toLowerCase()),
  )
}

// ---------------------------------------------------------
// CURRENT DRAFT analysis
// ---------------------------------------------------------

/**
 * Historical usage table for a set of current players.
 */
export function historicalUsage(rows, normalizedCurrent) {
  const result = []

  for (const player of normalizedCurrent) {
    const matches = getPlayerRows(rows, player)
    const teamsForPlayer = [...new Set(matches.map((r) => r.team))]
    const positions = [...new Set(matches.map((r) => r.position))]
    const position = positions.length > 0 ? positions[0] : '?'

    result.push({
      player: displayName(player, position),
      historicalTeams: teamsForPlayer.length,
      timesSelected: matches.length,
      teams: teamsForPlayer.join(', '),
    })
  }

  return result
}

/**
 * Which historical teams look most like this draft (by shared player count).
 */
export function teamOverlap(rows, teamNames, normalizedCurrent) {
  const currentSet = new Set(normalizedCurrent.map((p) => p.toLowerCase()))
  const result = []

  for (const team of teamNames) {
    const teamRows = getTeamRows(rows, team)
    const teamPlayers = new Set(teamRows.map((r) => r.player.toLowerCase()))
    const sharedNames = [...currentSet].filter((p) => teamPlayers.has(p))

    const sharedDisplay = sharedNames
      .map((name) => {
        const row = teamRows.find(
          (r) => r.player.toLowerCase() === name,
        )
        return row ? displayName(row.player, row.position) : name
      })
      .sort()

    result.push({
      historicalTeam: team,
      playersShared: sharedNames.length,
      sharedPlayers: sharedDisplay.join(', '),
    })
  }

  result.sort((a, b) => b.playersShared - a.playersShared)
  return result
}

/**
 * Current-player combination history.
 * For r from 2 to min(4, len), find teams containing each combo.
 */
export function currentCombinations(
  rows,
  teamNames,
  normalizedCurrent,
  positionLookup,
) {
  if (normalizedCurrent.length < 2) return []

  const result = []
  const maxR = Math.min(4, normalizedCurrent.length)

  for (let r = 2; r <= maxR; r++) {
    for (const combo of combinations(normalizedCurrent, r)) {
      const comboSet = new Set(combo.map((x) => x.toLowerCase()))
      const matchingTeams = []

      for (const team of teamNames) {
        const players = getTeamPlayerSet(rows, team)
        if ([...comboSet].every((p) => players.has(p))) {
          matchingTeams.push(team)
        }
      }

      const labels = combo.map(
        (player) =>
          displayName(player, positionLookup[player] || '?'),
      )

      result.push({
        combination: labels.join(' + '),
        players: r,
        timesTogether: matchingTeams.length,
        historicalTeams: matchingTeams.join(', '),
      })
    }
  }

  result.sort((a, b) => b.timesTogether - a.timesTogether)
  return result
}

// ---------------------------------------------------------
// PLAYER HISTORY analysis
// ---------------------------------------------------------

/**
 * Most common teammates for a player.
 */
export function commonTeammates(rows, selectedPlayer) {
  const playerRows = getPlayerRows(rows, selectedPlayer)
  const teams = [...new Set(playerRows.map((r) => r.team))]

  const teammateCounter = new Map()
  const teammatePosition = {}

  for (const team of teams) {
    const teammates = rows.filter(
      (r) => r.team === team && r.player !== selectedPlayer,
    )

    for (const t of teammates) {
      teammateCounter.set(t.player, (teammateCounter.get(t.player) || 0) + 1)
      teammatePosition[t.player] = t.position
    }
  }

  const sorted = [...teammateCounter.entries()].sort(
    (a, b) => b[1] - a[1],
  )

  return sorted.map(([teammate, count]) => ({
    teammate: displayName(teammate, teammatePosition[teammate]),
    timesTogether: count,
  }))
}

// ---------------------------------------------------------
// COMBINATIONS tab
// ---------------------------------------------------------

/**
 * All historical combinations of a given size across all teams.
 */
export function historicalCombinations(rows, teamNames, size) {
  const counter = new Map()
  const combinationTeams = new Map()
  const combinationPositions = {}

  for (const team of teamNames) {
    const teamRows = getTeamRows(rows, team)
    const players = [...new Set(teamRows.map((r) => r.player))].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    )

    for (const combo of combinations(players, size)) {
      const key = combo.join('|||')
      counter.set(key, (counter.get(key) || 0) + 1)

      if (!combinationTeams.has(key)) {
        combinationTeams.set(key, [])
      }
      combinationTeams.get(key).push(team)

      for (const player of combo) {
        const row = teamRows.find((r) => r.player === player)
        if (row) combinationPositions[player] = row.position
      }
    }
  }

  const sorted = [...counter.entries()].sort((a, b) => b[1] - a[1])

  return sorted.map(([key, count]) => {
    const combo = key.split('|||')
    const labels = combo.map(
      (player) =>
        displayName(player, combinationPositions[player] || '?'),
    )

    return {
      combination: labels.join(' + '),
      timesTogether: count,
      historicalTeams: combinationTeams.get(key).join(', '),
    }
  })
}

// ---------------------------------------------------------
// HISTORICAL TEAMS tab
// ---------------------------------------------------------

/**
 * Most similar historical teams (by shared player count).
 */
export function similarTeams(rows, teamNames, selectedTeam) {
  const teamRows = getTeamRows(rows, selectedTeam)
  const selectedPlayers = new Set(teamRows.map((r) => r.player))

  const result = []

  for (const otherTeam of teamNames) {
    if (otherTeam === selectedTeam) continue

    const otherRows = rows.filter((r) => r.team === otherTeam)
    const otherPlayers = new Set(otherRows.map((r) => r.player))
    const shared = [...selectedPlayers].filter((p) => otherPlayers.has(p))

    const sharedDisplay = shared
      .map((player) => {
        const row = otherRows.find((r) => r.player === player)
        return row ? displayName(row.player, row.position) : player
      })
      .sort()

    result.push({
      team: otherTeam,
      sharedPlayers: shared.length,
      players: sharedDisplay.join(', '),
    })
  }

  result.sort((a, b) => b.sharedPlayers - a.sharedPlayers)
  return result
}

/**
 * Count players per position on a team.
 */
export function positionCounts(teamRows) {
  const counts = { F: 0, M: 0, D: 0, G: 0 }
  for (const r of teamRows) {
    if (counts[r.position] !== undefined) counts[r.position]++
  }
  return counts
}
