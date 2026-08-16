import { useState } from 'react'
import Sidebar from './Sidebar'
import CurrentDraftTab from './CurrentDraftTab'
import PlayerHistoryTab from './PlayerHistoryTab'
import CombinationsTab from './CombinationsTab'
import HistoricalTeamsTab from './HistoricalTeamsTab'
import { SPORT_CONFIG } from '../utils/parseExcel'

const SUB_TABS = [
  { id: 'current', label: 'Current Draft', icon: '🔥' },
  { id: 'player', label: 'Player History', icon: '👤' },
  { id: 'combos', label: 'Combinations', icon: '🔗' },
  { id: 'teams', label: 'Historical Teams', icon: '📊' },
]

/**
 * Renders the full dashboard for one sport: sidebar + sub-tabs.
 * sportState comes from useSportState(sportKey).
 */
export default function SportDashboard({ sportKey, sportState }) {
  const [activeSubTab, setActiveSubTab] = useState('current')
  const config = SPORT_CONFIG[sportKey]
  const {
    fileName,
    sheetNames,
    selectedSheet,
    error,
    hasData,
    dataModel,
    selectedPlayer,
    selectedTeam,
    handleFile,
    handleSheetChange,
    handleClear,
    setSelectedPlayer,
    setSelectedTeam,
  } = sportState

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <Sidebar
        sportKey={sportKey}
        fileName={fileName}
        sheetNames={sheetNames}
        selectedSheet={selectedSheet}
        error={error}
        onFile={handleFile}
        onSheetChange={handleSheetChange}
        onClear={handleClear}
      />

      <main className="flex-1 p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-800">
            <span>{config.icon}</span>
            Fantasy {config.label} Draft Analyzer
          </h1>
          {selectedSheet && hasData && dataModel && (
            <p className="mt-1 text-sm text-slate-500">
              Database: {selectedSheet} ·{' '}
              {dataModel.teamNames.length} historical teams ·{' '}
              {dataModel.uniquePlayers.length} unique players
            </p>
          )}
        </header>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-20 text-center">
            <div className="mb-4 text-5xl">{config.icon}</div>
            <h2 className="text-xl font-semibold text-slate-700">
              Upload your {config.label} Excel database to begin
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Use the upload area in the sidebar to load your historical draft
              data. The analyzer supports both legacy and normalized sheet
              formats.
            </p>
          </div>
        ) : !dataModel ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-700">
            No draft data was found in the '{selectedSheet}' tab. Add historical
            drafts to that tab and upload the updated workbook.
          </div>
        ) : (
          <>
            <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
              {SUB_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={[
                    'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                    activeSubTab === tab.id
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {activeSubTab === 'current' && (
              <CurrentDraftTab
                rows={dataModel.rows}
                uniquePlayers={dataModel.uniquePlayers}
                teamNames={dataModel.teamNames}
                positionLookup={dataModel.positionLookup}
                playerLookup={dataModel.playerLookup}
              />
            )}

            {activeSubTab === 'player' && (
              <PlayerHistoryTab
                rows={dataModel.rows}
                uniquePlayers={dataModel.uniquePlayers}
                positionLookup={dataModel.positionLookup}
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
              />
            )}

            {activeSubTab === 'combos' && (
              <CombinationsTab
                rows={dataModel.rows}
                teamNames={dataModel.teamNames}
              />
            )}

            {activeSubTab === 'teams' && (
              <HistoricalTeamsTab
                rows={dataModel.rows}
                teamNames={dataModel.teamNames}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
                positions={config.positions}
              />
            )}

            <hr className="my-8 border-slate-200" />
            <p className="text-xs text-slate-400">
              Database: {selectedSheet} ·{' '}
              {dataModel.teamNames.length} historical teams ·{' '}
              {dataModel.uniquePlayers.length} unique players
            </p>
          </>
        )}
      </main>
    </div>
  )
}
