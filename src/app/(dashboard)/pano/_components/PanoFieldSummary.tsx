'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Flame, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { getMyPanoInsightsAction } from '@/app/(dashboard)/pano/myPulseActions'

export function PanoFieldSummary() {
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
        <div className="h-14 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        <div className="h-28 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
      </div>
    )
  }

  const streak = data?.fieldStreak ?? 0
  const field = data?.fieldWeek

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
          streak > 0
            ? 'border-orange-400/35 bg-gradient-to-r from-orange-50/90 to-amber-50/60 dark:from-orange-950/25 dark:to-amber-950/15'
            : 'border-[var(--border)] bg-[var(--bg-subtle)]/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Flame
            className={`h-5 w-5 shrink-0 ${streak > 0 ? 'text-orange-500' : 'text-[var(--text-3)]'}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-1)]">
              {streak > 0
                ? t('pulse.fieldStreakDays', { count: streak })
                : t('pulse.fieldStreakEmpty')}
            </p>
            <p className="text-xs text-[var(--text-3)] truncate">{t('pulse.fieldStreakHint')}</p>
          </div>
        </div>
        {streak > 0 && (
          <span className="text-2xl font-black tabular-nums text-orange-600 dark:text-orange-400 shrink-0">
            {streak}
          </span>
        )}
      </div>

      <Link
        href="/bugun/ilgilen"
        className="block rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm transition hover:border-brand/30 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-sm font-bold text-[var(--text-1)]">{t('pulse.panoFieldWeekTitle')}</p>
            <p className="text-xs text-[var(--text-3)] mt-0.5">{t('pulse.panoFieldWeekSubtitle')}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
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
      </Link>
    </div>
  )
}
