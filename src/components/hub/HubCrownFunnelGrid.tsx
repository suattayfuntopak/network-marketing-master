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
import { crownSolidMap } from '@/components/ui/SquareButton'
import { HUB_FUNNEL_PANO_COLOR } from '@/lib/ui/hubPanoMetricColors'

type HubCrownFunnelGridProps = {
  actuals: FunnelCounts
  targets: FunnelCounts
  hasGoal: boolean
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  loading?: boolean
  /** Saha Özetim: pano crown gradient kutular */
  panoVariant?: boolean
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
        const { Icon, barColor } = FUNNEL_METRIC_VISUAL[metric]
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
                ? clsx(crownSolidMap[panoColor], 'border border-white/20 text-white shadow-md')
                : 'border border-[var(--border)] bg-[var(--bg-card)]',
            )}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              {panoVariant ? (
                <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-white sm:text-sm">
                  <Icon className="h-[18px] w-[18px] shrink-0 text-white" strokeWidth={2.25} />
                  <span>{t(METRIC_LABEL_KEYS[metric])}</span>
                </span>
              ) : (
                <FunnelMetricLabel
                  metric={metric}
                  label={t(METRIC_LABEL_KEYS[metric])}
                  iconClassName="h-[18px] w-[18px]"
                  vivid
                  className="min-w-0 text-xs font-semibold text-[var(--text-1)] sm:text-sm"
                />
              )}
              {hasGoal ? (
                <span
                  className={clsx(
                    'shrink-0 text-xs font-bold tabular-nums',
                    panoVariant ? 'text-white/80' : 'text-[var(--text-3)]',
                  )}
                >
                  %{pct}
                </span>
              ) : null}
            </div>
            <p
              className={clsx(
                'mt-1 text-xl font-black tabular-nums md:text-2xl',
                panoVariant ? 'text-white' : 'text-[var(--text-1)]',
              )}
            >
              {actual}
              {hasGoal ? (
                <span className={clsx('text-sm font-bold', panoVariant ? 'text-white/75' : 'text-[var(--text-3)]')}>
                  {' '}
                  / {target}
                </span>
              ) : null}
            </p>
            <div
              className={clsx(
                'mt-2.5 h-1.5 overflow-hidden rounded-full',
                panoVariant ? 'bg-white/25' : 'bg-[var(--bg-subtle)]',
              )}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${hasGoal ? pct : actual > 0 ? 100 : 0}%`,
                  backgroundColor: panoVariant ? 'rgba(255,255,255,0.9)' : barColor,
                }}
              />
            </div>
            {hasGoal ? (
              <p
                className={clsx(
                  'mt-1.5 text-[10px] font-medium',
                  panoVariant ? 'text-white/70' : 'text-[var(--text-3)]',
                )}
              >
                {period === 'daily'
                  ? t('crown.hubDailyTarget')
                  : period === 'weekly'
                    ? t('crown.hubWeeklyTarget')
                    : period === 'monthly'
                      ? t('crown.hubMonthlyTarget')
                      : t('crown.hubYearlyTarget')}
              </p>
            ) : (
              <p
                className={clsx(
                  'mt-1.5 text-[10px] font-medium',
                  panoVariant ? 'text-white/70' : 'text-[var(--text-3)]',
                )}
              >
                {t('crown.noGoal')}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
