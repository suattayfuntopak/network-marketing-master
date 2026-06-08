'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'

type HubMonthHeroProps = {
  loginDays: number
  dayOfMonth: number
  daysInMonth: number
  monthPct: number
  isCurrentMonth: boolean
  loading?: boolean
}

export function HubMonthHero({
  loginDays,
  dayOfMonth,
  daysInMonth,
  monthPct,
  isCurrentMonth,
  loading,
}: HubMonthHeroProps) {
  const { t } = useTranslation()

  if (loading) return <Skeleton className="h-28 rounded-2xl" />

  const remaining = Math.max(0, daysInMonth - dayOfMonth)
  const subtitleKey = !isCurrentMonth
    ? 'crown.monthProgressSubtitlePast'
    : remaining === 0
      ? 'crown.monthProgressSubtitleLastDay'
      : 'crown.monthProgressSubtitleCurrent'

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-subtle)]/80 p-4 md:p-5">
      <div>
        <p className="text-xs text-[var(--text-3)] md:text-sm">
          {t(subtitleKey, { day: dayOfMonth, total: daysInMonth, remaining })}
        </p>
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
