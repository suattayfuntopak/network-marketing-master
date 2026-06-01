'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Flame } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { ONBOARDING_STEP_COUNT, type PulsePeriod } from '@/lib/domain/pulse'
import { getMyPulseSummaryAction } from '@/app/(dashboard)/pulse/actions'
import { PulseKpiCard } from './PulseKpiCard'
import { PulseDisclaimer } from './PulseDisclaimer'
import { Skeleton } from '@/components/ui/Skeleton'

const PERIOD_OPTIONS: PulsePeriod[] = ['today', '7d', '30d', 'ytd', 'all']

function periodLabel(t: (key: string) => string, p: PulsePeriod): string {
  if (p === 'today') return t('pulse.periodToday')
  if (p === '7d') return t('statsPage.period7d')
  if (p === '30d') return t('statsPage.period30d')
  if (p === 'ytd') return t('pulse.periodYtd')
  return t('statsPage.periodAll')
}

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
        <div className="flex flex-wrap rounded-xl bg-[var(--bg-subtle)] p-0.5 border border-[var(--border)] self-start gap-0.5">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                period === p
                  ? 'bg-[var(--bg-card)] text-brand shadow-sm border border-[var(--border)]'
                  : 'text-[var(--text-2)]'
              }`}
            >
              {periodLabel(t, p)}
            </button>
          ))}
        </div>
      </header>

      {data && data.streakDays > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          <Flame className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-semibold">{t('pulse.streak')}</span>
          <span>{t('pulse.streakDays', { count: data.streakDays })}</span>
        </div>
      )}

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

          {data.periodLearning && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              <PulseKpiCard
                label={`${t('pulse.periodReads')} · ${t('pulse.training')}`}
                primary={String(data.periodLearning.trainingReads)}
              />
              <PulseKpiCard
                label={`${t('pulse.periodReads')} · ${t('pulse.objections')}`}
                primary={String(data.periodLearning.objectionReads)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PulseKpiCard
              label={t('pulse.onboarding')}
              primary={t('pulse.onboardingSteps', {
                done: data.onboardingDone,
                total: ONBOARDING_STEP_COUNT,
              })}
              pct={Math.round((data.onboardingDone / ONBOARDING_STEP_COUNT) * 100)}
            />
            <PulseKpiCard
              label={t('pulse.videos')}
              primary={`${data.video.completed} / ${data.video.total}`}
              secondary={`${data.video.pct}%`}
              pct={data.video.pct}
            />
            {data.videoDropoff > 0 && (
              <PulseKpiCard
                label={t('pulse.videoDropoff')}
                primary={String(data.videoDropoff)}
              />
            )}
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
              {t('pulse.fieldActivity')}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <PulseKpiCard
                label={t('pulse.newCandidates')}
                primary={String(data.field.newCandidates)}
              />
              <PulseKpiCard label={t('pulse.calls')} primary={String(data.field.calls)} />
              <PulseKpiCard
                label={t('pulse.whatsapps')}
                primary={String(data.field.whatsapps)}
              />
              <PulseKpiCard
                label={t('pulse.presentationsSent')}
                primary={String(data.field.presentationsSent)}
              />
              <PulseKpiCard
                label={t('pulse.appointmentsSet')}
                primary={String(data.field.appointmentsSet)}
              />
              <PulseKpiCard
                label={t('pulse.appointmentsDone')}
                primary={String(data.field.appointmentsDone)}
              />
            </div>
          </div>
        </>
      ) : null}

      <PulseDisclaimer />
    </section>
  )
}
