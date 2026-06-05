'use client'

import { clsx } from 'clsx'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import type { HubMonthlyInsights } from '@/app/(dashboard)/crown/actions'

type HubMonthProgressProps = {
  data: HubMonthlyInsights | undefined
  loading?: boolean
}

export function HubMonthProgress({ data, loading }: HubMonthProgressProps) {
  const { t } = useTranslation()

  if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />

  if (!data) return null

  const TrendIcon =
    data.trend === 'up' ? TrendingUp : data.trend === 'down' ? TrendingDown : Minus
  const trendColor =
    data.trend === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : data.trend === 'down'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-[var(--text-3)]'

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--text-1)]">{t('crown.monthProgressTitle')}</p>
          <p className="mt-0.5 text-xs text-[var(--text-3)]">
            {t('crown.monthProgressSubtitle', {
              day: data.dayOfMonth,
              total: data.daysInMonth,
              pct: data.monthPct,
            })}
          </p>
        </div>
        <div className={clsx('flex items-center gap-1 text-xs font-bold', trendColor)}>
          <TrendIcon className="h-4 w-4" />
          {t('crown.monthTrend', { prev: data.prevMonthCalls, curr: data.currMonthCalls })}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${data.monthPct}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-[var(--bg-subtle)]/60 py-2">
          <p className="font-black tabular-nums text-[var(--text-1)]">{data.monthActuals.calls}</p>
          <p className="text-[var(--text-3)]">{t('pulse.calls')}</p>
        </div>
        <div className="rounded-lg bg-[var(--bg-subtle)]/60 py-2">
          <p className="font-black tabular-nums text-[var(--text-1)]">{data.monthActuals.newCandidates}</p>
          <p className="text-[var(--text-3)]">{t('pulse.newCandidates')}</p>
        </div>
        <div className="rounded-lg bg-[var(--bg-subtle)]/60 py-2">
          <p className="font-black tabular-nums text-[var(--text-1)]">{data.monthActuals.presentations}</p>
          <p className="text-[var(--text-3)]">{t('pulse.colPresentations')}</p>
        </div>
      </div>
    </div>
  )
}
