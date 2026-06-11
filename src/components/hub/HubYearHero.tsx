'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import type { HubSelfFieldMetrics } from '@/app/(dashboard)/crown/hubSelfActions'
import type { FunnelCounts } from '@/lib/domain/roadmap'

type HubYearHeroProps = {
  loginDays: number
  year: number
  dayOfYear: number
  totalDaysInYear: number
  yearPct: number
  isCurrentYear: boolean
  fieldMetrics?: HubSelfFieldMetrics
  yearlyActuals?: FunnelCounts
  loading?: boolean
}

export function HubYearHero({
  loginDays,
  year,
  dayOfYear,
  totalDaysInYear,
  yearPct,
  isCurrentYear,
  fieldMetrics,
  yearlyActuals,
  loading,
}: HubYearHeroProps) {
  const { t } = useTranslation()

  if (loading) return <Skeleton className="h-28 rounded-2xl" />

  const subtitleKey = isCurrentYear
    ? 'crown.yearProgressSubtitleCurrent'
    : 'crown.yearProgressSubtitlePast'

  const calls = fieldMetrics?.calls ?? 0
  const whatsapps = fieldMetrics?.whatsapps ?? 0
  const newMembers = yearlyActuals?.yeniUye ?? 0

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
      {(calls > 0 || whatsapps > 0 || newMembers > 0) && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center rounded-xl bg-[var(--bg-subtle)] px-2 py-2 text-center">
            <span className="text-base font-bold text-[var(--text-1)]">{calls}</span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
              {t('team.memberDetailWeeklyCalls')}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-[var(--bg-subtle)] px-2 py-2 text-center">
            <span className="text-base font-bold text-[var(--text-1)]">{whatsapps}</span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
              {t('team.memberDetailWeeklyWA')}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-[var(--bg-subtle)] px-2 py-2 text-center">
            <span className="text-base font-bold text-[var(--text-1)]">{newMembers}</span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
              {t('crown.funnelNewMembers')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
