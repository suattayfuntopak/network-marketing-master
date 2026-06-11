'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  FUNNEL_METRIC_ORDER,
  FUNNEL_METRIC_VISUAL,
  FunnelMetricLabel,
} from '@/lib/ui/funnelMetricVisuals'
import type { FunnelCounts } from '@/lib/domain/roadmap'
import { Skeleton } from '@/components/ui/Skeleton'
import { crownSoftMap } from '@/components/ui/SquareButton'
import { HUB_FUNNEL_PANO_COLOR } from '@/lib/ui/hubPanoMetricColors'

type HubCrownFunnelGridProps = {
  actuals: FunnelCounts
  targets: FunnelCounts
  hasGoal: boolean
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'
  loading?: boolean
  /** Saha Özetim: pano crown gradient kutular */
  panoVariant?: boolean
  /** Hedef yokken alt bilgi satırını gizle (üye aktivite özeti vb.) */
  hideNoGoalFooter?: boolean
  /** Saha Özetim: hedef durum/uyarı satırını tamamen gizle */
  hideFooter?: boolean
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
  panoVariant = false,
  hideNoGoalFooter = false,
  hideFooter = false,
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
        const panoColor = HUB_FUNNEL_PANO_COLOR[metric]
        const actual = actuals[metric]
        const target = targets[metric]
        const pct =
          hasGoal && target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : actual > 0 ? 100 : 0

        return (
          <div
            key={metric}
            className={clsx(
              'flex flex-col rounded-2xl p-3.5 shadow-sm md:p-4',
              panoVariant
                ? clsx(crownSoftMap[panoColor], 'border border-[var(--border)] bg-[var(--bg-card)]')
                : 'border border-[var(--border)] bg-[var(--bg-card)]',
            )}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              {panoVariant ? (
                <FunnelMetricLabel
                  metric={metric}
                  label={t(METRIC_LABEL_KEYS[metric])}
                  iconClassName="h-[18px] w-[18px]"
                  vivid
                  className="min-w-0 text-xs font-semibold text-[var(--text-1)] sm:text-sm"
                />
              ) : (
                <FunnelMetricLabel
                  metric={metric}
                  label={t(METRIC_LABEL_KEYS[metric])}
                  iconClassName="h-[18px] w-[18px]"
                  vivid
                  className="min-w-0 text-xs font-semibold text-[var(--text-1)] sm:text-sm"
                />
              )}
              {hasGoal && period !== 'all' ? (
                <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--text-3)]">
                  %{pct}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xl font-black tabular-nums text-[var(--text-1)] md:text-2xl">
              {actual}
              {hasGoal ? (
                <span className="text-sm font-bold text-[var(--text-3)]">
                  {' '}
                  / {period === 'all' ? '∞' : target}
                </span>
              ) : null}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${hasGoal ? pct : actual > 0 ? 100 : 0}%`,
                  backgroundColor: barColor,
                  opacity: panoVariant ? 0.55 : 1,
                }}
              />
            </div>
            {hideFooter ? null : hasGoal ? (
              <p className="mt-1.5 text-[10px] font-medium text-[var(--text-3)]">
                {period === 'daily'
                  ? t('crown.hubDailyTarget')
                  : period === 'weekly'
                    ? t('crown.hubWeeklyTarget')
                    : period === 'monthly'
                      ? t('crown.hubMonthlyTarget')
                      : t('crown.hubYearlyTarget')}
              </p>
            ) : hideNoGoalFooter ? null : (
              <p className="mt-1.5 text-[10px] font-medium text-[var(--text-3)]">
                {t('crown.noGoal')}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
