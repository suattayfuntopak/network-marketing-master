'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Flame } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import {
  ONBOARDING_STEP_COUNT,
  emptyMyPulseSummary,
  type PulsePeriod,
} from '@/lib/domain/pulse'
import { getMyPulseSummaryAction } from '@/app/(dashboard)/pulse/actions'
import { PulseKpiCard } from './PulseKpiCard'
import { PulseDisclaimer } from './PulseDisclaimer'
import { PulseAiInsight } from './PulseAiInsight'
import { Skeleton } from '@/components/ui/Skeleton'

const PERIOD_OPTIONS: PulsePeriod[] = ['today', '7d', '30d', 'ytd', 'all']

function periodLabel(t: (key: string) => string, p: PulsePeriod): string {
  if (p === 'today') return t('pulse.periodToday')
  if (p === '7d') return t('statsPage.period7d')
  if (p === '30d') return t('statsPage.period30d')
  if (p === 'ytd') return t('pulse.periodYtd')
  return t('statsPage.periodAll')
}

type Props = {
  /** İstatistikler sayfasında bir punto daha büyük tipografi */
  comfortableTypography?: boolean
}

export function PulseMySection({ comfortableTypography = false }: Props) {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const [period, setPeriod] = useState<PulsePeriod>('30d')

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['pulse-my', ws?.workspaceId, period],
    queryFn: () => getMyPulseSummaryAction(ws!.workspaceId, period),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
    retry: 1,
  })

  if (!ws?.workspaceId) return null

  const display = data ?? emptyMyPulseSummary(period)
  const showFallbackNote = isError

  const titleCls = comfortableTypography
    ? 'text-base font-bold text-[var(--text-1)] flex items-center gap-2'
    : 'text-sm font-bold text-[var(--text-1)] flex items-center gap-2'
  const subtitleCls = comfortableTypography
    ? 'mt-1 text-sm text-[var(--text-3)] leading-relaxed'
    : 'mt-1 text-xs text-[var(--text-3)]'
  const periodBtnCls = comfortableTypography ? 'text-sm' : 'text-[10px]'
  const noteCls = comfortableTypography ? 'text-xs' : 'text-[10px]'
  const fieldHdrCls = comfortableTypography
    ? 'mb-2 text-sm font-bold uppercase tracking-wider text-[var(--text-3)]'
    : 'mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]'

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={titleCls}>
            <Activity className="h-4 w-4 text-brand" />
            {t('pulse.myTitle')}
          </h2>
          <p className={subtitleCls}>{t('pulse.mySubtitle')}</p>
        </div>
        <div className="flex flex-wrap rounded-xl bg-[var(--bg-subtle)] p-0.5 border border-[var(--border)] self-start gap-0.5">
          {PERIOD_OPTIONS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-2 py-1 ${periodBtnCls} font-bold transition-all ${
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

      {showFallbackNote && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          {t('statsPage.pulseLoadFallback')}
        </p>
      )}

      {display.streakDays > 0 && (
        <div
          className={`flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-amber-800 dark:text-amber-200 ${comfortableTypography ? 'text-sm' : 'text-xs'}`}
        >
          <Flame className="h-4 w-4 shrink-0 text-amber-600" />
          <span className="font-semibold">{t('pulse.streak')}</span>
          <span>{t('pulse.streakDays', { count: display.streakDays })}</span>
        </div>
      )}

      <PulseAiInsight scope="personal" comfortableTypography={comfortableTypography} />

      <p className={`${noteCls} text-[var(--text-3)]`}>{t('pulse.allTimeNote')}</p>
      <p className={`${noteCls} text-[var(--text-3)] -mt-2`}>{t('pulse.periodFieldNote')}</p>

      {isLoading || (isFetching && !data) ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <PulseKpiCard
              comfortableTypography={comfortableTypography}
              label={t('pulse.training')}
              primary={`${display.learning.trainingRead} / 30`}
              secondary={`${display.learning.trainingPct}%`}
              pct={display.learning.trainingPct}
            />
            <PulseKpiCard
              comfortableTypography={comfortableTypography}
              label={t('pulse.objections')}
              primary={`${display.learning.objectionRead} / 34`}
              secondary={`${display.learning.objectionPct}%`}
              pct={display.learning.objectionPct}
            />
            <PulseKpiCard
              comfortableTypography={comfortableTypography}
              label={t('pulse.trainingFav')}
              primary={String(display.learning.trainingFav)}
            />
            <PulseKpiCard
              comfortableTypography={comfortableTypography}
              label={t('pulse.objectionFav')}
              primary={String(display.learning.objectionFav)}
            />
          </div>

          {display.periodLearning && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              <PulseKpiCard
                comfortableTypography={comfortableTypography}
                label={`${t('pulse.periodReads')} · ${t('pulse.training')}`}
                primary={String(display.periodLearning.trainingReads)}
              />
              <PulseKpiCard
                comfortableTypography={comfortableTypography}
                label={`${t('pulse.periodReads')} · ${t('pulse.objections')}`}
                primary={String(display.periodLearning.objectionReads)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PulseKpiCard
              comfortableTypography={comfortableTypography}
              label={t('pulse.onboarding')}
              primary={t('pulse.onboardingSteps', {
                done: display.onboardingDone,
                total: ONBOARDING_STEP_COUNT,
              })}
              pct={Math.round((display.onboardingDone / ONBOARDING_STEP_COUNT) * 100)}
            />
            <PulseKpiCard
              comfortableTypography={comfortableTypography}
              label={t('pulse.videos')}
              primary={`${display.video.completed} / ${display.video.total}`}
              secondary={`${display.video.pct}%`}
              pct={display.video.pct}
            />
            {display.videoDropoff > 0 && (
              <PulseKpiCard
                comfortableTypography={comfortableTypography}
                label={t('pulse.videoDropoff')}
                primary={String(display.videoDropoff)}
              />
            )}
          </div>

          <div>
            <p className={fieldHdrCls}>{t('pulse.fieldActivity')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <PulseKpiCard
                comfortableTypography={comfortableTypography}
                label={t('pulse.newCandidates')}
                primary={String(display.field.newCandidates)}
              />
              <PulseKpiCard
                comfortableTypography={comfortableTypography}
                label={t('pulse.calls')}
                primary={String(display.field.calls)}
              />
              <PulseKpiCard
                comfortableTypography={comfortableTypography}
                label={t('pulse.whatsapps')}
                primary={String(display.field.whatsapps)}
              />
              <PulseKpiCard
                comfortableTypography={comfortableTypography}
                label={t('pulse.presentationsSent')}
                primary={String(display.field.presentationsSent)}
              />
              <PulseKpiCard
                comfortableTypography={comfortableTypography}
                label={t('pulse.appointmentsSet')}
                primary={String(display.field.appointmentsSet)}
              />
              <PulseKpiCard
                comfortableTypography={comfortableTypography}
                label={t('pulse.appointmentsDone')}
                primary={String(display.field.appointmentsDone)}
              />
            </div>
          </div>
        </>
      )}

      <PulseDisclaimer comfortableTypography={comfortableTypography} />
    </section>
  )
}
