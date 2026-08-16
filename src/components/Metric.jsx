/**
 * A metric card showing a label and value.
 */
export default function Metric({ label, value, accent = 'emerald' }) {
  const accentMap = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    slate: 'text-slate-700',
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold ${accentMap[accent] || accentMap.emerald}`}>
        {value}
      </div>
    </div>
  )
}
