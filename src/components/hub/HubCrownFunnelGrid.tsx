'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import {
  FUNNEL_METRIC_ORDER,
  FUNNEL_METRIC_VISUAL,
  FunnelMetricLabel,
} from '@/lib/ui/funnelMetricVisuals'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import { Skeleton } from '@/components/ui/Skeleton'

type HubCrownFunnelGridProps = {
  actuals: FunnelCounts
  targets: FunnelCounts
  hasGoal: boolean
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'
  loading?: boolean
}

const METRIC_LABEL_KEYS: Record<(typeof FUNNEL_METRIC_ORDER)[number], string> = {
  arama: 'dashboard.dailyTrackMetricCalls',
  tanisma: 'dashboard.dailyTrackMetricMeetings',
  sunum: 'dashboard.dailyTrackMetricPresentations',
  yeniUye: 'dashboard.dailyTrackMetricMembers',
}

export function HubCrownFunnelGrid({
  actuals,
  targets,
  hasGoal,
  period,
  loading,
}: HubCrownFunnelGridProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {FUNNEL_METRIC_ORDER.map(metric => {
        const { barColor } = FUNNEL_METRIC_VISUAL[metric]
        const actual = actuals[metric]
        const target = targets[metric]
        const pct =
          hasGoal && target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : actual > 0 ? 100 : 0

        return (
          <div
            key={metric}
            className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3.5 shadow-sm md:p-4"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <FunnelMetricLabel
                metric={metric}
                label={t(METRIC_LABEL_KEYS[metric])}
                iconClassName="h-[18px] w-[18px]"
                vivid
                className="min-w-0 text-xs font-semibold text-[var(--text-1)] sm:text-sm"
              />
              {hasGoal ? (
                <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--text-3)]">%{pct}</span>
              ) : null}
            </div>
            <p className="mt-1 text-xl font-black tabular-nums text-[var(--text-1)] md:text-2xl">
              {actual}
              {hasGoal ? (
                <span className="text-sm font-bold text-[var(--text-3)]">
                  {' '}
                  / {target}
                </span>
              ) : null}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${hasGoal ? pct : actual > 0 ? 100 : 0}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
            {hasGoal ? (
              <p className="mt-1.5 text-[10px] font-medium text-[var(--text-3)]">
                {period === 'daily'
                  ? t('crown.hubDailyTarget')
                  : period === 'weekly'
                    ? t('crown.hubWeeklyTarget')
                    : period === 'monthly'
                      ? t('crown.hubMonthlyTarget')
                      : period === 'yearly'
                        ? t('crown.hubYearlyTarget')
                        : t('crown.hubAllTimeActual')}
              </p>
            ) : (
              <p className="mt-1.5 text-[10px] font-medium text-[var(--text-3)]">{t('crown.noGoal')}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
