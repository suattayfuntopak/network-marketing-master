'use client'

type Props = {
  label: string
  primary: string
  secondary?: string
  pct?: number
  comfortableTypography?: boolean
}

export function PulseKpiCard({
  label,
  primary,
  secondary,
  pct,
  comfortableTypography = false,
}: Props) {
  // comfortableTypography = İstatistikler sayfası → StatsKpiCards ile aynı ölçek
  const labelCls = comfortableTypography
    ? 'text-sm font-bold uppercase tracking-wider text-[var(--text-3)]'
    : 'text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]'
  const secondaryCls = comfortableTypography
    ? 'mt-1 text-sm text-[var(--text-3)] font-semibold'
    : 'mt-0.5 text-xs text-[var(--text-2)]'
  const primaryCls = comfortableTypography
    ? 'mt-1 text-2xl font-black text-[var(--text-1)]'
    : 'mt-1 text-2xl font-black text-[var(--text-1)]'

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
      <p className={labelCls}>{label}</p>
      <p className={primaryCls}>{primary}</p>
      {secondary && <p className={secondaryCls}>{secondary}</p>}
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
