import { useState } from 'react'
import SportDashboard from './components/SportDashboard'
import { useSportState } from './hooks/useSportState'
import { SPORT_CONFIG } from './utils/parseExcel'

const SPORT_TABS = Object.entries(SPORT_CONFIG).map(([key, cfg]) => ({
  id: key,
  label: cfg.label,
  icon: cfg.icon,
}))

export default function App() {
  const [activeSport, setActiveSport] = useState('soccer')

  // Each sport gets its own independent state
  const soccerState = useSportState('soccer')
  const footballState = useSportState('football')

  const sportState = activeSport === 'soccer' ? soccerState : footballState

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top-level sport switcher */}
      <div className="border-b border-slate-200 bg-white px-6 py-3 lg:px-8">
        <div className="flex gap-2">
          {SPORT_TABS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setActiveSport(sport.id)}
              className={[
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                activeSport === sport.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
              ].join(' ')}
            >
              <span className="text-lg">{sport.icon}</span>
              {sport.label}
            </button>
          ))}
        </div>
      </div>

      <SportDashboard sportKey={activeSport} sportState={sportState} />
    </div>
  )
}
