'use client'

import { BrainCircuit, Users, Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import { CardInfo } from './CardInfo'
import type { AiUsageAnalytics, AiUsageGroupStat, AiTier, AiSegment } from '@/lib/domain/aiUsageAnalytics'

type Props = {
  analytics: AiUsageAnalytics | undefined
  isLoading: boolean
}

const cardClass = 'relative rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm'

function StatTriplet({ stat }: { stat: AiUsageGroupStat }) {
  const { t } = useTranslation()
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-lg font-black tabular-nums text-[var(--text-1)]">{stat.avgDailyPerUser}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-3)]">{t('platformPage.aiUsageAvgDaily')}</p>
        </div>
        <div>
          <p className="text-lg font-black tabular-nums text-[var(--text-1)]">{stat.medianDailyPerUser}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-3)]">{t('platformPage.aiUsageMedianDaily')}</p>
        </div>
        <div>
          <p className="text-lg font-black tabular-nums text-fuchsia-600 dark:text-fuchsia-300">{stat.p90DailyPerUser}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-3)]">{t('platformPage.aiUsageP90Daily')}</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] font-medium text-[var(--text-3)]">
        {t('platformPage.aiUsageActiveOfTotal', { active: stat.activeCount, total: stat.workspaceCount })}
        {' · '}
        {t('platformPage.aiUsageAvgTotalPerUser', { value: stat.avgTotalPerUser })}
      </p>
    </>
  )
}

export function PlatformAiUsageAnalytics({ analytics, isLoading }: Props) {
  const { t } = useTranslation()

  const tierLabel = (tier: AiTier) =>
    t(
      tier === 'pro'
        ? 'platformPage.aiUsageTierPro'
        : tier === 'plus'
          ? 'platformPage.aiUsageTierPlus'
          : tier === 'basic'
            ? 'platformPage.aiUsageTierBasic'
            : 'platformPage.aiUsageTierFree',
    )
  const segmentLabel = (segment: AiSegment) =>
    t(segment === 'independent' ? 'platformPage.aiUsageSegmentIndependent' : 'platformPage.aiUsageSegmentTeam')

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <BrainCircuit className="h-4 w-4 text-fuchsia-600 dark:text-fuchsia-400" />
        <h2 className="text-sm font-bold text-[var(--text-1)]">{t('platformPage.aiUsageTitle')}</h2>
        <span className="rounded-full bg-[var(--bg-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-3)]">
          {t('platformPage.aiUsageWindowHint', { days: analytics?.windowDays ?? 30 })}
        </span>
        <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-600 dark:text-fuchsia-300">
          {t('platformPage.aiUsageAnonymNote')}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : !analytics || analytics.totalWorkspaces === 0 ? (
        <div className={`${cardClass} text-center`}>
          <p className="text-sm text-[var(--text-2)]">{t('platformPage.aiUsageEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Genel — hero */}
          <div className={`${cardClass} border-fuchsia-300/40 dark:border-fuchsia-500/20`}>
            <CardInfo cardKey="aiOverall" />
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-600 dark:text-fuchsia-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-300">
                {t('platformPage.aiUsageOverall')}
              </span>
              <span className="text-[10px] font-medium text-[var(--text-3)]">
                · {t('platformPage.aiUsageTotalActions', { value: analytics.overall.totalActions })}
              </span>
            </div>
            <StatTriplet stat={analytics.overall} />
          </div>

          {/* Lisans kademesine göre */}
          {analytics.byTier.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
                {t('platformPage.aiUsageByTier')}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {analytics.byTier.map(({ tier, stat }) => (
                  <div key={tier} className={cardClass}>
                    <CardInfo cardKey="aiByTier" />
                    <p className="mb-2 text-xs font-bold text-[var(--text-1)]">{tierLabel(tier)}</p>
                    <StatTriplet stat={stat} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Segmente göre */}
          {analytics.bySegment.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-3)]">
                {t('platformPage.aiUsageBySegment')}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {analytics.bySegment.map(({ segment, stat }) => (
                  <div key={segment} className={cardClass}>
                    <CardInfo cardKey="aiBySegment" />
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[var(--text-1)]">
                      <Users className="h-3.5 w-3.5 text-[var(--text-3)]" />
                      {segmentLabel(segment)}
                    </p>
                    <StatTriplet stat={stat} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
