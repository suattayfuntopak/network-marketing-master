'use client'

import { Target } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import type { FunnelCounts } from '@/lib/domain/roadmap'

type HubGoalChipRowProps = {
  targets: FunnelCounts
  actuals: FunnelCounts
  hasGoal: boolean
  fieldStreak?: number
}

const CHIPS: { key: keyof FunnelCounts; color: string }[] = [
  { key: 'arama', color: '#534AB7' },
  { key: 'tanisma', color: '#0F6E56' },
  { key: 'sunum', color: '#854F0B' },
  { key: 'yeniUye', color: '#72243E' },
]

export function HubGoalChipRow({ targets, actuals, hasGoal, fieldStreak }: HubGoalChipRowProps) {
  const { t } = useTranslation()

  if (!hasGoal) {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
        {t('crown.noGoal')}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-brand" strokeWidth={1.75} />
          <p className="text-sm font-bold text-[var(--text-1)]">{t('crown.todayGoalTitle')}</p>
        </div>
        {fieldStreak != null && fieldStreak > 0 ? (
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
            {t('crown.fieldStreakChip', { count: fieldStreak })}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map(({ key, color }) => {
          const target = targets[key]
          const actual = actuals[key]
          const done = target > 0 && actual >= target
          return (
            <span
              key={key}
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                done
                  ? 'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-1)]',
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {t(`hedef.${key}`)}: {actual}/{target}
            </span>
          )
        })}
      </div>
    </div>
  )
}
