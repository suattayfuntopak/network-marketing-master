import { clsx } from 'clsx'

export type HubKpiItem = {
  label: string
  value: number | string
  valueClass?: string
  borderClass?: string
}

type HubKpiRowProps = {
  items: HubKpiItem[]
  columns?: 2 | 3 | 4
}

export function HubKpiRow({ items, columns = 4 }: HubKpiRowProps) {
  const gridClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 3
        ? 'grid-cols-2 md:grid-cols-3'
        : 'grid-cols-2 md:grid-cols-4'

  return (
    <div className={clsx('grid gap-3', gridClass)}>
      {items.map(item => (
        <div
          key={item.label}
          className={clsx(
            'rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-4 text-center shadow-sm',
            item.borderClass,
          )}
        >
          <p className={clsx('text-2xl font-black tabular-nums md:text-3xl', item.valueClass ?? 'text-[var(--text-1)]')}>
            {item.value}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--text-3)]">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
