'use client'

import { Users, Sparkles, ShieldCheck, BookOpen } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

type Props = {
  totalUsersCount: number
  independentCount: number
  totalPaidCount: number
  pendingCount: number
}

export function PlatformKpiCards({ totalUsersCount, independentCount, totalPaidCount, pendingCount }: Props) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block">
          {t('platformPage.kpiTotalLeaders')}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-black text-[var(--text-1)]">{totalUsersCount}</span>
          <Users className="h-4.5 w-4.5 text-[var(--text-3)] ml-auto" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block text-purple-600 dark:text-purple-300">
          {t('platformPage.kpiIndependent')}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-black text-purple-600 dark:text-purple-300">{independentCount}</span>
          <Sparkles className="h-4.5 w-4.5 text-purple-600 dark:text-purple-300 ml-auto animate-pulse" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block text-emerald-600 dark:text-emerald-300">
          {t('platformPage.kpiPaid')}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{totalPaidCount}</span>
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-300 ml-auto" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <span className="text-[9px] font-bold text-[var(--text-3)] uppercase tracking-wider block text-amber-600 dark:text-amber-300">
          {t('platformPage.kpiTrainingRequests')}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-black text-amber-700 dark:text-amber-300">{pendingCount}</span>
          <BookOpen className="h-4.5 w-4.5 text-amber-600 dark:text-amber-300 ml-auto" />
        </div>
      </div>
    </div>
  )
}
