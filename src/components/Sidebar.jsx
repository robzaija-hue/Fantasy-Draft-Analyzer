import { useRef } from 'react'
import { SPORT_CONFIG } from '../utils/parseExcel'

/**
 * Sidebar: file upload + sheet selector.
 * Controlled component — all state is passed in from the parent.
 */
export default function Sidebar({
  sportKey,
  fileName,
  sheetNames,
  selectedSheet,
  error,
  onFile,
  onSheetChange,
  onClear,
}) {
  const inputRef = useRef(null)
  const config = SPORT_CONFIG[sportKey] || SPORT_CONFIG.soccer

  const handleFile = (file) => {
    if (file) onFile(file)
  }

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = ''
    onClear()
  }

  return (
    <aside className="flex w-full flex-col gap-5 border-r border-slate-200 bg-white p-5 lg:w-72 lg:min-h-screen">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          {config.label} Historical Database
        </h2>
      </div>

      {/* File upload */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Upload your Excel database
        </label>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/50"
        >
          <div className="text-3xl mb-2">📁</div>
          <div className="text-sm text-slate-600">
            {fileName ? (
              <span className="font-medium text-emerald-600">
                {fileName}
              </span>
            ) : (
              <>
                <span className="font-medium text-slate-700">
                  Click to upload
                </span>{' '}
                or drag & drop
              </>
            )}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            .xlsx or .xls files
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      {/* Sheet selector */}
      {sheetNames.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Database
          </label>
          <select
            value={selectedSheet}
            onChange={(e) => onSheetChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {sheetNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {fileName && (
        <button
          onClick={handleClear}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          Clear data
        </button>
      )}

      <div className="mt-auto border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">
          Phase 1 — Excel remains the master historical database.
        </p>
      </div>
    </aside>
  )
}
