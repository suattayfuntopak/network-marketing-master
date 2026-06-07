'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  FUNNEL_METRIC_ORDER,
  FUNNEL_METRIC_VISUAL,
} from '@/lib/ui/funnelMetricVisuals'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import { Skeleton } from '@/components/ui/Skeleton'

type HubCrownFunnelGridProps = {
  actuals: FunnelCounts
  targets: FunnelCounts
  hasGoal: boolean
  period: 'weekly' | 'monthly'
  loading?: boolean
}

function metricLabelKey(metric: (typeof FUNNEL_METRIC_ORDER)[number]): string {
  if (metric === 'arama') return 'crown.metricCall'
  if (metric === 'tanisma') return 'crown.metricMeet'
  if (metric === 'sunum') return 'crown.metricPresentation'
  return 'crown.metricMember'
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
        const { Icon, color, barColor } = FUNNEL_METRIC_VISUAL[metric]
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
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="h-[18px] w-[18px]" style={{ color }} strokeWidth={2.25} />
              </span>
              {hasGoal ? (
                <span className="text-xs font-bold tabular-nums text-[var(--text-3)]">%{pct}</span>
              ) : null}
            </div>
            <p className="text-xs font-semibold text-[var(--text-2)]">{t(metricLabelKey(metric))}</p>
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
                {period === 'weekly' ? t('crown.hubWeeklyTarget') : t('crown.hubMonthlyTarget')}
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
