/**
 * A section header with consistent styling.
 */
export default function SectionHeader({ children, icon }) {
  return (
    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
      {icon && <span className="text-xl">{icon}</span>}
      {children}
    </h3>
  )
}
