import { useMemo } from 'react'
import {
  getTeamRows,
  positionCounts,
  similarTeams,
} from '../utils/analysis'
import { displayName } from '../utils/parseExcel'
import DataTable from './DataTable'
import Metric from './Metric'
import SectionHeader from './SectionHeader'

export default function HistoricalTeamsTab({
  rows,
  teamNames,
  selectedTeam,
  onSelectTeam,
  positions = ['F', 'M', 'D', 'G'],
}) {
  const teamRows = useMemo(
    () => getTeamRows(rows, selectedTeam),
    [rows, selectedTeam],
  )

  const teamTableData = useMemo(() => {
    return teamRows.map((r) => ({
      position: r.position,
      player: displayName(r.player, r.position),
    }))
  }, [teamRows])

  const counts = useMemo(
    () => positionCounts(teamRows, positions),
    [teamRows, positions],
  )

  const similarityData = useMemo(
    () => similarTeams(rows, teamNames, selectedTeam),
    [rows, teamNames, selectedTeam],
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Historical Teams
        </h2>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Choose historical team
        </label>
        <select
          value={selectedTeam}
          onChange={(e) => onSelectTeam(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          {teamNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <SectionHeader>{selectedTeam}</SectionHeader>
        <DataTable
          columns={[
            { key: 'position', label: 'Position' },
            { key: 'player', label: 'Player' },
          ]}
          data={teamTableData}
        />
      </div>

      <div className="space-y-3">
        <SectionHeader>Team summary</SectionHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {positions.map((pos) => (
            <Metric
              key={pos}
              label={pos}
              value={counts[pos] || 0}
              accent="blue"
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeader>Most similar historical teams</SectionHeader>
        <DataTable
          columns={[
            { key: 'team', label: 'Team' },
            { key: 'sharedPlayers', label: 'Shared Players' },
            { key: 'players', label: 'Players' },
          ]}
          data={similarityData}
          initialSort={{ key: 'sharedPlayers', dir: 'desc' }}
        />
      </div>
    </div>
  )
}
