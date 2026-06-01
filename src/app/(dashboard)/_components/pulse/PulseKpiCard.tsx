'use client'

type Props = {
  label: string
  primary: string
  secondary?: string
  pct?: number
}

export function PulseKpiCard({ label, primary, secondary, pct }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--text-1)]">{primary}</p>
      {secondary && (
        <p className="mt-0.5 text-xs text-[var(--text-2)]">{secondary}</p>
      )}
      {pct !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-300"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
    </div>
  )
}
