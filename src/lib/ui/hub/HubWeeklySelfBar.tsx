'use client'

import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import type { HubWeeklySelfPayload } from '@/app/(dashboard)/crown/actions'

type HubWeeklySelfBarProps = {
  data: HubWeeklySelfPayload | undefined
  loading?: boolean
}

export function HubWeeklySelfBar({ data, loading }: HubWeeklySelfBarProps) {
  const { t } = useTranslation()

  if (loading) {
    return <div className="h-20 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
  }
  if (!data?.hasGoal) return null

  const pct = data.pctOverall
  const gap = data.callsGap

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-[var(--text-1)]">{t('crown.weeklySelfTitle')}</p>
        <span className={clsx('text-lg font-black tabular-nums', pct >= 100 ? 'text-emerald-600' : 'text-brand')}>
          %{pct}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div
          className={clsx('h-full rounded-full transition-all', pct >= 100 ? 'bg-emerald-500' : 'bg-brand')}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="text-xs text-[var(--text-2)]">
        {t('crown.weeklySelfMeta', {
          actual: data.weeklyActuals.arama,
          target: data.weeklyTargets.arama,
        })}
      </p>
      {gap > 0 ? (
        <p className="rounded-lg bg-[#EEEDFE]/60 px-3 py-2 text-xs font-semibold text-[#534AB7] dark:bg-[#1e1b4b]/50 dark:text-[#a5b4fc]">
          {t('crown.weeklyActionHint', { count: gap })}
        </p>
      ) : (
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t('crown.weeklyGoalMet')}</p>
      )}
    </div>
  )
}
