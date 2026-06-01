'use client'

import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { getIndependentOwnersPulseAction } from '@/app/(dashboard)/pulse/actions'
import { ONBOARDING_STEP_COUNT } from '@/lib/domain/pulse'
import { Skeleton } from '@/components/ui/Skeleton'

export function PulseIndependentOwnersSection() {
  const { t } = useTranslation()

  const { data: result, isLoading } = useQuery({
    queryKey: ['pulse-independent-owners'],
    queryFn: getIndependentOwnersPulseAction,
    staleTime: 30_000,
    throwOnError: false,
  })

  const rows = result?.rows ?? []
  const showWarning = result?.warning === 'load_failed'

  if (!isLoading && rows.length === 0 && !showWarning) return null

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <header>
        <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-2">
          <Users className="h-4 w-4 text-brand" />
          {t('statsPage.independentPulseTitle')}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed">
          {t('statsPage.independentPulseSubtitle')}
        </p>
      </header>

      {showWarning && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          {t('statsPage.dataPartialWarning')}
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--text-3)]">{t('statsPage.aiIndependentEmpty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] scrollbar-none">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-2)]">
                <th className="p-3 font-semibold">{t('statsPage.colPartnerName')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colTraining')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colObjections')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colDqsg')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.colVideos')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.newCandidates')}</th>
                <th className="p-3 font-semibold text-center">{t('pulse.calls')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map(row => {
                const dqsgPct = Math.min(
                  100,
                  Math.round((row.onboardingDone / ONBOARDING_STEP_COUNT) * 100)
                )
                return (
                  <tr key={row.userId} className="hover:bg-[var(--bg-subtle)]/60">
                    <td className="p-3">
                      <p className="font-semibold text-[var(--text-1)]">{row.fullName}</p>
                      <p className="text-xs text-[var(--text-3)] truncate max-w-[220px]">{row.email}</p>
                    </td>
                    <td className="p-3 text-center font-bold tabular-nums">{row.trainingPct}%</td>
                    <td className="p-3 text-center font-bold tabular-nums">{row.objectionPct}%</td>
                    <td className="p-3 text-center font-bold tabular-nums">{dqsgPct}%</td>
                    <td className="p-3 text-center font-bold tabular-nums">{row.videoPct}%</td>
                    <td className="p-3 text-center font-bold tabular-nums">{row.newCandidates}</td>
                    <td className="p-3 text-center font-bold tabular-nums">{row.calls}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[var(--text-3)]">{t('statsPage.realtimePulseNote')}</p>
    </section>
  )
}
