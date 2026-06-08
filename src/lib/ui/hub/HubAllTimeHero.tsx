'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import type { HubSelfFieldMetrics } from '@/app/(dashboard)/crown/actions'
import type { FunnelCounts } from '@/lib/domain/roadmap'

type HubAllTimeHeroProps = {
  activeDays: number
  fieldMetrics?: HubSelfFieldMetrics
  allTimeActuals?: FunnelCounts
  loading?: boolean
}

export function HubAllTimeHero({ activeDays, fieldMetrics, allTimeActuals, loading }: HubAllTimeHeroProps) {
  const { t } = useTranslation()

  if (loading) return <Skeleton className="h-28 rounded-2xl" />

  const calls = fieldMetrics?.calls ?? 0
  const whatsapps = fieldMetrics?.whatsapps ?? 0
  const newCandidates = fieldMetrics?.newCandidates ?? 0
  const newMembers = allTimeActuals?.yeniUye ?? 0

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-subtle)]/80 p-4 md:p-5">
      <p className="text-xs font-semibold text-[var(--text-1)] md:text-sm">
        {t('crown.allTimeHeroTitle')}
      </p>
      <p className="mt-1 text-xs text-[var(--text-3)] md:text-sm">
        {t('crown.allTimeHeroSubtitle', { days: activeDays })}
      </p>
      {(calls > 0 || whatsapps > 0 || newCandidates > 0 || newMembers > 0) && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center rounded-xl bg-[var(--bg-subtle)] px-2 py-2 text-center">
            <span className="text-base font-bold text-[var(--text-1)]">{calls}</span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
              {t('dashboard.memberDetailWeeklyCalls')}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-[var(--bg-subtle)] px-2 py-2 text-center">
            <span className="text-base font-bold text-[var(--text-1)]">{whatsapps}</span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
              {t('dashboard.memberDetailWeeklyWA')}
            </span>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-[var(--bg-subtle)] px-2 py-2 text-center">
            <span className="text-base font-bold text-[var(--text-1)]">{newCandidates}</span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
              {t('crown.funnelNewCandidates')}
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
