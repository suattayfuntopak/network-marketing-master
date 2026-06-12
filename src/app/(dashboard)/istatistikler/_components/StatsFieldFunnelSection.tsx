'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, ExternalLink } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubCrownFunnelGrid } from '@/components/hub/HubCrownFunnelGrid'
import type { PulsePeriod } from '@/lib/domain/pulse'
import { pulsePeriodToHubGridPeriod } from '@/lib/domain/hubPeriodPrefetch'
import { PULSE_PERIOD_OPTIONS } from '@/lib/domain/pulsePeriodLabels'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { getStatsFunnelBundleAction, type StatsFunnelBundle } from '../actions'

type Props = {
  period: PulsePeriod
}

export function StatsFieldFunnelSection({ period }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  useEffect(() => {
    for (const p of PULSE_PERIOD_OPTIONS) {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.statsFunnelBundle(p),
        queryFn: () => getStatsFunnelBundleAction(p),
        staleTime: QUERY_STALE.funnelBundle,
      })
    }
  }, [queryClient])

  const { data: bundle, isLoading } = useQuery({
    queryKey: queryKeys.statsFunnelBundle(period),
    queryFn: () => getStatsFunnelBundleAction(period),
    staleTime: QUERY_STALE.funnelBundle,
    // SSR hydrate + dönem geçişi: önce dehydrate cache, yoksa önceki dönem verisi.
    placeholderData: (prev) =>
      queryClient.getQueryData<StatsFunnelBundle>(queryKeys.statsFunnelBundle(period)) ?? prev,
  })

  const funnel = bundle?.actuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }
  const targets = bundle?.targets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }
  const hasGoal = bundle?.hasGoal ?? false
  const hasActivity = funnel.arama + funnel.tanisma + funnel.sunum + funnel.yeniUye > 0
  const showGrid = isLoading || hasActivity || hasGoal

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--text-1)] flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-brand" />
            {t('statsPage.fieldFunnelTitle')}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-3)] leading-relaxed">
            {t('statsPage.fieldFunnelSubtitle')}
          </p>
        </div>
        <Link
          href="/pipeline"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/50 px-3 py-2 text-xs font-semibold text-brand transition hover:border-brand/30"
        >
          {t('statsPage.fieldFunnelCta')}
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      {!showGrid ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)]/40 px-4 py-6 text-center text-sm text-[var(--text-3)]">
          {t('statsPage.fieldFunnelEmpty')}
        </p>
      ) : (
        <HubCrownFunnelGrid
          actuals={funnel}
          targets={targets}
          hasGoal={hasGoal}
          period={pulsePeriodToHubGridPeriod(period)}
          targetFooterKey={period === '30d' ? 'crown.hubRolling30Target' : undefined}
          loading={isLoading}
        />
      )}
    </section>
  )
}
