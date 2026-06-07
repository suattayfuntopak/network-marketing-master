'use client'

import { Minus, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { dailyTrackAccent } from './dailyTrackTheme'
import { FunnelMetricLabel, type FunnelMetricKey } from '@/lib/ui/funnelMetricVisuals'

type Props = {
  metric: FunnelMetricKey
  label: string
  value: number
  targetLabel?: string
  onChange: (next: number) => void
}

export function DailyMetricRow({ metric, label, value, targetLabel, onChange }: Props) {
  function bump(delta: number) {
    onChange(Math.min(9999, Math.max(0, value + delta)))
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:p-4">
      <FunnelMetricLabel metric={metric} label={label} vivid className="mb-2 text-sm font-semibold text-[var(--text-1)]" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
          <button
            type="button"
            onClick={() => bump(-1)}
            aria-label={`${label} −1`}
            className="flex h-11 min-w-11 flex-1 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-1)] transition hover:border-[#0095DD]/30 hover:bg-[#54C1F0]/10 active:scale-95 sm:h-10 sm:min-w-10 sm:flex-none"
          >
            <Minus className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={9999}
            value={value}
            onChange={e => onChange(Math.min(9999, Math.max(0, parseInt(e.target.value, 10) || 0)))}
            className={clsx(
              'h-11 w-full max-w-[5.5rem] rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-center text-xl font-bold tabular-nums text-[var(--text-1)] outline-none focus:ring-2 sm:h-10',
              dailyTrackAccent.inputFocus,
            )}
          />
          <button
            type="button"
            onClick={() => bump(1)}
            aria-label={`${label} +1`}
            className="flex h-11 min-w-11 flex-1 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-1)] transition hover:border-[#0095DD]/30 hover:bg-[#54C1F0]/10 active:scale-95 sm:h-10 sm:min-w-10 sm:flex-none"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>
        {targetLabel ? (
          <p className={clsx('text-center text-xs font-medium text-[var(--text-3)] sm:text-right')}>
            {targetLabel}
          </p>
        ) : null}
      </div>
    </div>
  )
}
