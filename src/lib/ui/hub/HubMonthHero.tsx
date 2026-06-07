'use client'

import { clsx } from 'clsx'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import type { HubMonthlyInsights } from '@/app/(dashboard)/crown/actions'
import { Skeleton } from '@/components/ui/Skeleton'

type HubMonthHeroProps = {
  loginDays: number
  dayOfMonth: number
  daysInMonth: number
  monthPct: number
  insights: HubMonthlyInsights | undefined
  loading?: boolean
}

export function HubMonthHero({
  loginDays,
  dayOfMonth,
  daysInMonth,
  monthPct,
  insights,
  loading,
}: HubMonthHeroProps) {
  const { t } = useTranslation()

  if (loading) return <Skeleton className="h-28 rounded-2xl" />

  const trend = insights?.trend ?? 'flat'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trend === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend === 'down'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-[var(--text-3)]'

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-subtle)]/80 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--text-3)] md:text-sm">
            {t('crown.monthProgressSubtitle', { day: dayOfMonth, total: daysInMonth, pct: monthPct })}
          </p>
        </div>
        {insights ? (
          <div className={clsx('flex items-center gap-1 text-xs font-bold', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            {t('crown.monthTrend', { prev: insights.prevMonthCalls, curr: insights.currMonthCalls })}
          </div>
        ) : null}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${monthPct}%` }} />
      </div>
      <p className="mt-3 text-sm font-semibold text-[var(--text-2)]">
        {t('crown.hubLoginDaysMonth', { count: loginDays })}
      </p>
    </div>
  )
}
