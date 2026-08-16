import { useState, useMemo } from 'react'

/**
 * A reusable, sortable data table component.
 * columns: [{ key, label, sortable?: boolean, width?: string }]
 * data: array of row objects
 */
export default function DataTable({ columns, data, initialSort = null }) {
  const [sortKey, setSortKey] = useState(initialSort?.key || null)
  const [sortDir, setSortDir] = useState(initialSort?.dir || 'desc')

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    const col = columns.find((c) => c.key === sortKey)
    if (!col || col.sortable === false) return data

    const sorted = [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]

      if (typeof av === 'number' && typeof bv === 'number') {
        return av - bv
      }
      return String(av ?? '').localeCompare(String(bv ?? ''))
    })

    return sortDir === 'asc' ? sorted : sorted.reverse()
  }, [data, sortKey, sortDir, columns])

  const handleSort = (key) => {
    const col = columns.find((c) => c.key === key)
    if (!col || col.sortable === false) return

    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        No data to display
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {columns.map((col) => {
              const isSortable = col.sortable !== false
              const isActive = sortKey === col.key

              return (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => isSortable && handleSort(col.key)}
                  className={[
                    'px-4 py-3 font-semibold text-slate-700',
                    isSortable ? 'cursor-pointer select-none' : '',
                    isActive ? 'text-emerald-600' : '',
                  ].join(' ')}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {isSortable && (
                      <span className="text-xs text-slate-400">
                        {isActive
                          ? sortDir === 'asc'
                            ? '▲'
                            : '▼'
                          : '↕'}
                      </span>
                    )}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedData.map((row, i) => (
            <tr
              key={i}
              className="transition-colors hover:bg-emerald-50/40"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 text-slate-700 align-top"
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
