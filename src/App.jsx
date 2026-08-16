import { useState, useMemo, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import CurrentDraftTab from './components/CurrentDraftTab'
import PlayerHistoryTab from './components/PlayerHistoryTab'
import CombinationsTab from './components/CombinationsTab'
import HistoricalTeamsTab from './components/HistoricalTeamsTab'
import { buildDataModel } from './utils/analysis'

const TABS = [
  { id: 'current', label: 'Current Draft', icon: '🔥' },
  { id: 'player', label: 'Player History', icon: '👤' },
  { id: 'combos', label: 'Combinations', icon: '🔗' },
  { id: 'teams', label: 'Historical Teams', icon: '📊' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('current')
  const [rawRows, setRawRows] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [hasData, setHasData] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Selections for tabs
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')

  const dataModel = useMemo(() => {
    if (rawRows.length === 0) return null
    return buildDataModel(rawRows)
  }, [rawRows])

  const handleDataLoaded = useCallback(
    (payload) => {
      if (payload.error) {
        setError(payload.error)
        setHasData(false)
        return
      }

      setError(null)
      setLoading(false)
      setRawRows(payload.rows)
      setSelectedSheet(payload.selectedSheet)

      const model = buildDataModel(payload.rows)
      if (model.uniquePlayers.length > 0 && !selectedPlayer) {
        setSelectedPlayer(model.uniquePlayers[0])
      }
      if (model.teamNames.length > 0 && !selectedTeam) {
        setSelectedTeam(model.teamNames[0])
      }
      setHasData(payload.rows.length > 0)
    },
    [selectedPlayer, selectedTeam],
  )

  const handleClear = useCallback(() => {
    setRawRows([])
    setSelectedSheet('')
    setHasData(false)
    setError(null)
    setSelectedPlayer('')
    setSelectedTeam('')
  }, [])

  const handleFileLoading = useCallback(() => {
    setLoading(true)
    setError(null)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      <Sidebar
        onDataLoaded={(payload) => {
          if (payload.error) {
            handleDataLoaded(payload)
          } else {
            handleDataLoaded(payload)
          }
        }}
        onClear={handleClear}
        loading={loading}
        error={error}
      />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-800">
            <span>⚽</span>
            Fantasy Soccer Draft Analyzer
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
            <div className="mb-4 text-5xl">⚽</div>
            <h2 className="text-xl font-semibold text-slate-700">
              Upload your Excel database to begin
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
            {/* Tab navigation */}
            <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700',
                  ].join(' ')}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Tab content */}
            {activeTab === 'current' && (
              <CurrentDraftTab
                rows={dataModel.rows}
                uniquePlayers={dataModel.uniquePlayers}
                teamNames={dataModel.teamNames}
                positionLookup={dataModel.positionLookup}
                playerLookup={dataModel.playerLookup}
              />
            )}

            {activeTab === 'player' && (
              <PlayerHistoryTab
                rows={dataModel.rows}
                uniquePlayers={dataModel.uniquePlayers}
                positionLookup={dataModel.positionLookup}
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
              />
            )}

            {activeTab === 'combos' && (
              <CombinationsTab
                rows={dataModel.rows}
                teamNames={dataModel.teamNames}
              />
            )}

            {activeTab === 'teams' && (
              <HistoricalTeamsTab
                rows={dataModel.rows}
                teamNames={dataModel.teamNames}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
              />
            )}

            {/* Footer */}
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
