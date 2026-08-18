import * as XLSX from 'xlsx'

const SOCCER_POSITIONS = ['F', 'M', 'D', 'G']
const FOOTBALL_POSITIONS = ['QB', 'RB', 'WR', 'TE']

export const SPORT_CONFIG = {
  soccer: {
    label: 'Soccer',
    icon: '⚽',
    positions: SOCCER_POSITIONS,
    normalizedSheet: 'Football Fantasy Drafts',
  },
  football: {
    label: 'Football',
    icon: '🏈',
    positions: FOOTBALL_POSITIONS,
    normalizedSheet: null,
  },
}

/**
 * Parse the original position-row format used in Sheet1.
 * Each team starts with a team-name row, then position rows
 * where the remaining cells in that row are players of that position.
 */
function parseLegacySheet(rawRows, positions) {
  const posSet = new Set(positions.map((p) => p.toUpperCase()))
  const teams = []
  let currentTeam = null
  let currentPosition = null

  for (const row of rawRows) {
    const values = row
      .map((x) => (x == null ? '' : String(x).trim()))
      .filter((x) => x !== '')

    if (values.length === 0) continue

    const first = values[0].toUpperCase()

    if (posSet.has(first)) {
      currentPosition = first
      if (currentTeam === null) continue

      for (const player of values.slice(1)) {
        teams[teams.length - 1].players.push({
          player,
          position: currentPosition,
        })
      }
    } else {
      currentTeam = values[0]
      teams.push({ team: currentTeam, players: [] })
    }
  }

  return teams
}

/**
 * Parse the Phase 1 normalized database format:
 * Draft / Competition | Position | Player
 * The first row is the header.
 */
function parseNormalizedSheet(rawRows, positions) {
  if (rawRows.length < 2) return []

  const header = rawRows[0].map((c) => String(c ?? '').trim())
  const required = ['Draft / Competition', 'Position', 'Player']
  const hasAll = required.every((r) => header.includes(r))

  if (!hasAll) return []

  const idx = {
    team: header.indexOf('Draft / Competition'),
    position: header.indexOf('Position'),
    player: header.indexOf('Player'),
  }

  const posSet = new Set(positions.map((p) => p.toUpperCase()))
  const teamsMap = new Map()

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i]
    const teamName = String(row[idx.team] ?? '').trim()
    const position = String(row[idx.position] ?? '').trim().toUpperCase()
    const player = String(row[idx.player] ?? '').trim()

    if (!teamName || !player) continue
    if (!posSet.has(position)) continue

    if (!teamsMap.has(teamName)) {
      teamsMap.set(teamName, { team: teamName, players: [] })
    }

    teamsMap.get(teamName).players.push({ player, position })
  }

  return Array.from(teamsMap.values()).filter((t) => t.players.length > 0)
}

/**
 * Read an uploaded Excel file and return { sheetNames, sheets }.
 * sheets is a map of sheetName -> array of teams.
 * sportKey selects which position set to use for validation.
 */
export async function parseWorkbook(file, sportKey = 'soccer') {
  const config = SPORT_CONFIG[sportKey] || SPORT_CONFIG.soccer
  const positions = config.positions
  const normalizedSheet = config.normalizedSheet

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetNames = workbook.SheetNames
  const sheets = {}

  for (const sheetName of sheetNames) {
    const worksheet = workbook.Sheets[sheetName]
    const rawRows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: true,
      defval: null,
    })

    if (normalizedSheet && sheetName === normalizedSheet) {
      sheets[sheetName] = parseNormalizedSheet(rawRows, positions)
    } else {
      sheets[sheetName] = parseLegacySheet(rawRows, positions)
    }
  }

  return { sheetNames, sheets }
}

/**
 * Flatten teams into an array of { team, player, position } rows.
 */
export function flattenTeams(teams) {
  const rows = []
  for (const team of teams) {
    for (const p of team.players) {
      rows.push({
        team: team.team,
        player: p.player,
        position: p.position,
      })
    }
  }
  return rows
}

/**
 * Produce a display name like "Matt Grimes (M)".
 */
export function displayName(player, position) {
  return `${player} (${position})`
}


export { SPORT_CONFIG }