'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'

type HubYearHeroProps = {
  loginDays: number
  year: number
  dayOfYear: number
  totalDaysInYear: number
  yearPct: number
  isCurrentYear: boolean
  loading?: boolean
}

export function HubYearHero({
  loginDays,
  year,
  dayOfYear,
  totalDaysInYear,
  yearPct,
  isCurrentYear,
  loading,
}: HubYearHeroProps) {
  const { t } = useTranslation()

  if (loading) return <Skeleton className="h-24 rounded-2xl" />

  const subtitleKey = isCurrentYear
    ? 'crown.yearProgressSubtitleCurrent'
    : 'crown.yearProgressSubtitlePast'

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-subtle)]/80 p-4 md:p-5">
      <p className="text-xs font-semibold text-[var(--text-1)] md:text-sm">
        {t('crown.yearHeroTitle', { year })}
      </p>
      <p className="mt-1 text-xs text-[var(--text-3)] md:text-sm">
        {t(subtitleKey, { day: dayOfYear, total: totalDaysInYear, loginDays })}
      </p>
      {isCurrentYear ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${yearPct}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
