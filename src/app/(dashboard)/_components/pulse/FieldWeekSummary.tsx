'use client'

import { useQuery } from '@tanstack/react-query'
import { Flame } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getMyPanoInsightsAction } from '@/app/(dashboard)/pano/myPulseActions'
import { Skeleton } from '@/components/ui/Skeleton'

export function FieldWeekSummary() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()

  const { data, isLoading } = useQuery({
    queryKey: ['pano-field-insights', ws?.workspaceId],
    queryFn: () => getMyPanoInsightsAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  if (!ws?.workspaceId) return null

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    )
  }

  const activeDays = data?.fieldStreak ?? 0
  const field = data?.fieldWeek
  const fullWeek = activeDays >= 7

  const kpis = [
    { label: t('pulse.newCandidates'), value: field?.newCandidates ?? 0 },
    { label: t('pulse.calls'), value: field?.calls ?? 0 },
    { label: t('pulse.whatsapps'), value: field?.whatsapps ?? 0 },
    { label: t('pulse.colPresentations'), value: field?.presentationsSent ?? 0 },
  ]

  return (
    <div className="space-y-3">
      <div
        className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${
          activeDays > 0
            ? 'border-orange-400/35 bg-gradient-to-r from-orange-50/90 to-amber-50/60 dark:from-orange-950/25 dark:to-amber-950/15'
            : 'border-[var(--border)] bg-[var(--bg-subtle)]/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Flame
            className={`h-5 w-5 shrink-0 ${activeDays > 0 ? 'text-orange-500' : 'text-[var(--text-3)]'}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-1)]">
              {fullWeek
                ? t('pulse.fieldStreakFullWeek')
                : activeDays > 0
                  ? t('pulse.fieldStreakDays', { count: activeDays })
                  : t('pulse.fieldStreakEmpty')}
            </p>
            <p className="text-xs text-[var(--text-3)] truncate">{t('pulse.fieldStreakHint')}</p>
          </div>
        </div>
        {activeDays > 0 && (
          <span className="text-2xl font-black tabular-nums text-orange-600 dark:text-orange-400 shrink-0">
            {activeDays}/7
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-sm font-bold text-[var(--text-1)]">{t('pulse.bugunFieldWeekTitle')}</p>
          <p className="text-xs text-[var(--text-3)] mt-0.5">{t('pulse.bugunFieldWeekSubtitle')}</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {kpis.map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-[var(--bg-subtle)]/60 px-2 py-2.5 text-center">
              <p className="text-lg font-black tabular-nums text-[var(--text-1)]">{value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-3)] leading-tight mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
