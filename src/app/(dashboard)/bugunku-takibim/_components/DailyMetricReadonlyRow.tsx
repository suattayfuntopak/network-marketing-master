'use client'

import { FunnelMetricCount, FunnelMetricLabel, type FunnelMetricKey } from '@/lib/ui/funnelMetricVisuals'

type Props = {
  metric: FunnelMetricKey
  label: string
  value: number
  targetLabel?: string
}

export function DailyMetricReadonlyRow({ metric, label, value, targetLabel }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 md:p-4">
      <FunnelMetricLabel metric={metric} label={label} vivid className="mb-2 text-sm font-semibold text-[var(--text-1)]" />
      <div className="flex items-center justify-between gap-3">
        <FunnelMetricCount metric={metric} value={value} vivid className="text-2xl font-bold tabular-nums" />
        {targetLabel ? (
          <p className="text-xs font-medium text-[var(--text-3)]">{targetLabel}</p>
        ) : null}
      </div>
    </div>
  )
}
