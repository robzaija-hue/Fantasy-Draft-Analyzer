import { useMemo } from 'react'
import { getPlayerRows, commonTeammates } from '../utils/analysis'
import { displayName } from '../utils/parseExcel'
import DataTable from './DataTable'
import Metric from './Metric'
import SectionHeader from './SectionHeader'

export default function PlayerHistoryTab({
  rows,
  uniquePlayers,
  positionLookup,
  selectedPlayer,
  onSelectPlayer,
}) {
  const playerRows = useMemo(
    () => getPlayerRows(rows, selectedPlayer),
    [rows, selectedPlayer],
  )

  const timesSelected = playerRows.length
  const differentTeams = new Set(playerRows.map((r) => r.team)).size

  const historyData = useMemo(() => {
    return playerRows.map((r) => ({
      historicalTeam: r.team,
      player: displayName(r.player, r.position),
    }))
  }, [playerRows])

  const teammateData = useMemo(
    () => commonTeammates(rows, selectedPlayer),
    [rows, selectedPlayer],
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Player History</h2>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Choose a player
        </label>
        <select
          value={selectedPlayer}
          onChange={(e) => onSelectPlayer(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          {uniquePlayers.map((p) => (
            <option key={p} value={p}>
              {displayName(p, positionLookup[p] || '?')}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <Metric
          label="Times selected historically"
          value={timesSelected}
        />
        <Metric
          label="Different historical teams"
          value={differentTeams}
        />
      </div>

      <div className="space-y-3">
        <SectionHeader>Historical teams</SectionHeader>
        <DataTable
          columns={[
            { key: 'historicalTeam', label: 'Historical Team' },
            { key: 'player', label: 'Player' },
          ]}
          data={historyData}
        />
      </div>

      <div className="space-y-3">
        <SectionHeader>Most common teammates</SectionHeader>
        {teammateData.length > 0 ? (
          <DataTable
            columns={[
              { key: 'teammate', label: 'Teammate' },
              { key: 'timesTogether', label: 'Times Together' },
            ]}
            data={teammateData}
            initialSort={{ key: 'timesTogether', dir: 'desc' }}
          />
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No teammate data available
          </div>
        )}
      </div>
    </div>
  )
}
