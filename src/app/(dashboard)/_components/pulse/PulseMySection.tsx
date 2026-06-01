'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { ONBOARDING_STEP_COUNT, type PulsePeriod } from '@/lib/domain/pulse'
import { getMyPulseSummaryAction } from '@/app/(dashboard)/pulse/actions'
import { PulseKpiCard } from './PulseKpiCard'
import { PulseDisclaimer } from './PulseDisclaimer'
import { Skeleton } from '@/components/ui/Skeleton'

export function PulseMySection() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const [period, setPeriod] = useState<PulsePeriod>('30d')

  const { data, isLoading } = useQuery({
    queryKey: ['pulse-my', ws?.workspaceId, period],
    queryFn: () => getMyPulseSummaryAction(ws!.workspaceId, period),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  if (!ws?.workspaceId) return null

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" />
            {t('pulse.myTitle')}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-3)]">{t('pulse.mySubtitle')}</p>
        </div>
        <div className="flex rounded-xl bg-[var(--bg-subtle)] p-0.5 border border-[var(--border)] self-start">
          {(['7d', '30d', 'all'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                period === p
                  ? 'bg-[var(--bg-card)] text-brand shadow-sm border border-[var(--border)]'
                  : 'text-[var(--text-2)]'
              }`}
            >
              {p === '7d' && t('statsPage.period7d')}
              {p === '30d' && t('statsPage.period30d')}
              {p === 'all' && t('statsPage.periodAll')}
            </button>
          ))}
        </div>
      </header>

      <p className="text-[10px] text-[var(--text-3)]">{t('pulse.allTimeNote')}</p>
      <p className="text-[10px] text-[var(--text-3)] -mt-2">{t('pulse.periodFieldNote')}</p>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <PulseKpiCard
              label={t('pulse.training')}
              primary={`${data.learning.trainingRead} / 30`}
              secondary={`${data.learning.trainingPct}%`}
              pct={data.learning.trainingPct}
            />
            <PulseKpiCard
              label={t('pulse.objections')}
              primary={`${data.learning.objectionRead} / 34`}
              secondary={`${data.learning.objectionPct}%`}
              pct={data.learning.objectionPct}
            />
            <PulseKpiCard
              label={t('pulse.trainingFav')}
              primary={String(data.learning.trainingFav)}
            />
            <PulseKpiCard
              label={t('pulse.objectionFav')}
              primary={String(data.learning.objectionFav)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PulseKpiCard
              label={t('pulse.onboarding')}
              primary={t('pulse.onboardingSteps', {
                done: data.onboardingDone,
                total: ONBOARDING_STEP_COUNT,
              })}
              pct={Math.round((data.onboardingDone / ONBOARDING_STEP_COUNT) * 100)}
            />
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
              {t('pulse.fieldActivity')}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <PulseKpiCard
                label={t('pulse.newCandidates')}
                primary={String(data.field.newCandidates)}
              />
              <PulseKpiCard label={t('pulse.calls')} primary={String(data.field.calls)} />
              <PulseKpiCard
                label={t('pulse.whatsapps')}
                primary={String(data.field.whatsapps)}
              />
            </div>
          </div>
        </>
      ) : null}

      <PulseDisclaimer />
    </section>
  )
}
