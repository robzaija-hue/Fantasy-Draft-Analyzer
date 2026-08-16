import { useState, useMemo } from 'react'
import { historicalCombinations } from '../utils/analysis'
import DataTable from './DataTable'
import SectionHeader from './SectionHeader'

export default function CombinationsTab({ rows, teamNames }) {
  const [combinationSize, setCombinationSize] = useState(2)
  const [search, setSearch] = useState('')

  const combinationsData = useMemo(
    () => historicalCombinations(rows, teamNames, combinationSize),
    [rows, teamNames, combinationSize],
  )

  const filteredData = useMemo(() => {
    if (!search.trim()) return combinationsData
    const lower = search.toLowerCase()
    return combinationsData.filter((row) =>
      row.combination.toLowerCase().includes(lower),
    )
  }, [combinationsData, search])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Historical Player Combinations
        </h2>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Combination size
        </label>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {[2, 3].map((size) => (
            <button
              key={size}
              onClick={() => setCombinationSize(size)}
              className={[
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                combinationSize === size
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800',
              ].join(' ')}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Search for a player (optional)
        </label>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by player name..."
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="space-y-3">
        <SectionHeader>
          {filteredData.length} combination
          {filteredData.length !== 1 ? 's' : ''}
        </SectionHeader>
        <DataTable
          columns={[
            { key: 'combination', label: 'Combination' },
            {
              key: 'timesTogether',
              label: 'Times Together',
            },
            {
              key: 'historicalTeams',
              label: 'Historical Teams',
            },
          ]}
          data={filteredData}
          initialSort={{ key: 'timesTogether', dir: 'desc' }}
        />
      </div>
    </div>
  )
}
