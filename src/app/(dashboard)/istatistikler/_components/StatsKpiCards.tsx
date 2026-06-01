'use client'

import { Users, Activity, Award, Target } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

interface StatsMetrics {
  total: number
  active: number
  joined: number
  conversionRate: number
  presentationRate: number
}

interface Props {
  metrics: StatsMetrics
}

export function StatsKpiCards({ metrics }: Props) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 relative overflow-hidden">
        <span className="text-sm font-bold text-[var(--text-3)] uppercase tracking-wider block">
          {t('statsPage.kpiTotalLeads')}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[var(--text-1)]">{metrics.total}</span>
          <Users className="h-4 w-4 text-[var(--text-3)] ml-auto" />
        </div>
        <p className="text-sm text-[var(--text-3)] mt-1 font-semibold">
          {t('statsPage.kpiTotalLeadsDesc')}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <span className="text-sm font-bold text-[var(--text-3)] uppercase tracking-wider block">
          {t('statsPage.kpiActiveLeads')}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#534AB7]">{metrics.active}</span>
          <Activity className="h-4 w-4 text-[#534AB7] ml-auto" />
        </div>
        <p className="text-sm text-[var(--text-3)] mt-1 font-semibold">
          {t('statsPage.kpiActiveLeadsDesc')}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <span className="text-sm font-bold text-[var(--text-3)] uppercase tracking-wider block">
          {t('statsPage.kpiConversionRate')}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#065F46]">%{metrics.conversionRate}</span>
          <Award className="h-4 w-4 text-[#065F46] ml-auto" />
        </div>
        <p className="text-sm text-[var(--text-3)] mt-1 font-semibold text-emerald-600 dark:text-emerald-400">
          {metrics.joined} {t('statsPage.kpiBecameMember')}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <span className="text-sm font-bold text-[var(--text-3)] uppercase tracking-wider block">
          {t('statsPage.kpiPresentationRate')}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-black text-[#0369A1]">%{metrics.presentationRate}</span>
          <Target className="h-4 w-4 text-[#0369A1] ml-auto" />
        </div>
        <p className="text-sm text-[var(--text-3)] mt-1 font-semibold">
          {t('statsPage.kpiPresentationRateDesc')}
        </p>
      </div>
    </div>
  )
}
