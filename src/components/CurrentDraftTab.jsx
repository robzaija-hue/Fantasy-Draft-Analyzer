import { useState, useMemo } from 'react'
import {
  historicalUsage,
  teamOverlap,
  currentCombinations,
} from '../utils/analysis'
import { displayName } from '../utils/parseExcel'
import DataTable from './DataTable'
import Metric from './Metric'
import SectionHeader from './SectionHeader'

export default function CurrentDraftTab({
  rows,
  uniquePlayers,
  teamNames,
  positionLookup,
  playerLookup,
}) {
  const [currentText, setCurrentText] = useState('')

  const currentPlayers = useMemo(() => {
    return currentText
      .replace(/,/g, '\n')
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => x !== '')
  }, [currentText])

  const normalizedCurrent = useMemo(() => {
    return currentPlayers.map((p) => playerLookup[p.toLowerCase()] || p)
  }, [currentPlayers, playerLookup])

  const usageData = useMemo(() => {
    if (normalizedCurrent.length === 0) return []
    return historicalUsage(rows, normalizedCurrent)
  }, [rows, normalizedCurrent])

  const overlapData = useMemo(() => {
    if (normalizedCurrent.length === 0) return []
    return teamOverlap(rows, teamNames, normalizedCurrent)
  }, [rows, teamNames, normalizedCurrent])

  const comboData = useMemo(() => {
    if (normalizedCurrent.length < 2) return []
    return currentCombinations(rows, teamNames, normalizedCurrent, positionLookup)
  }, [rows, teamNames, normalizedCurrent, positionLookup])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Current Draft</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter players selected in the current draft. Use one player per line
          or separate players with commas.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Current players
        </label>
        <textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          rows={7}
          placeholder={'Matt Grimes\nTyrick Mitchell\nDominik Szoboszlai\nDavid Raya'}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {normalizedCurrent.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Enter some current draft selections above.
        </div>
      ) : (
        <>
          {/* Current selections */}
          <div className="space-y-3">
            <SectionHeader>Current selections</SectionHeader>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {normalizedCurrent.map((player, i) => {
                const pos = positionLookup[player] || '?'
                return (
                  <Metric
                    key={i}
                    label="Player"
                    value={displayName(player, pos)}
                  />
                )
              })}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Historical usage */}
          <div className="space-y-3">
            <SectionHeader>Historical usage</SectionHeader>
            <DataTable
              columns={[
                { key: 'player', label: 'Player' },
                {
                  key: 'historicalTeams',
                  label: 'Historical Teams',
                },
                {
                  key: 'timesSelected',
                  label: 'Times Selected',
                },
                { key: 'teams', label: 'Teams' },
              ]}
              data={usageData}
              initialSort={{ key: 'timesSelected', dir: 'desc' }}
            />
          </div>

          {/* Historical team overlap */}
          <div className="space-y-3">
            <SectionHeader>
              Which historical teams look most like this draft?
            </SectionHeader>
            <DataTable
              columns={[
                { key: 'historicalTeam', label: 'Historical Team' },
                {
                  key: 'playersShared',
                  label: 'Players Shared',
                },
                { key: 'sharedPlayers', label: 'Shared Players' },
              ]}
              data={overlapData}
              initialSort={{ key: 'playersShared', dir: 'desc' }}
            />
          </div>

          {/* Current combinations */}
          {normalizedCurrent.length >= 2 && (
            <div className="space-y-3">
              <SectionHeader>
                Current-player combination history
              </SectionHeader>
              <DataTable
                columns={[
                  { key: 'combination', label: 'Combination' },
                  { key: 'players', label: 'Players' },
                  {
                    key: 'timesTogether',
                    label: 'Times Together',
                  },
                  {
                    key: 'historicalTeams',
                    label: 'Historical Teams',
                  },
                ]}
                data={comboData}
                initialSort={{ key: 'timesTogether', dir: 'desc' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
