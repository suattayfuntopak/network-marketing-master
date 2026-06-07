'use client'

import Link from 'next/link'
import { ArrowRight, Target } from 'lucide-react'
import { clsx } from 'clsx'
import { Skeleton } from '@/components/ui/Skeleton'
import { useUserGoal } from '@/hooks/useUserGoal'
import { useTranslation } from '@/providers/LanguageProvider'
import type { FunnelCounts } from '@/lib/domain/roadmap'

const FUNNEL_KEYS: (keyof FunnelCounts)[] = ['arama', 'tanisma', 'sunum', 'yeniUye']

export function PanoTodaySummary() {
  const { t } = useTranslation()
  const { goal, progress, isLoading } = useUserGoal()

  if (isLoading) {
    return <Skeleton className="h-36 rounded-2xl" />
  }

  const hasGoal = !!goal && !!progress

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEEDFE] dark:bg-[#534AB7]/20">
            <Target className="h-5 w-5 text-[#534AB7]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[var(--text-1)]">{t('dashboard.panoTodayTitle')}</h2>
            <p className="text-xs text-[var(--text-3)]">{t('dashboard.panoTodaySubtitle')}</p>
          </div>
        </div>
        <Link
          href="/bugun/ilgilen?tab=daily"
          className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#534AB7] transition hover:bg-[#EEEDFE]/60 dark:hover:bg-[#534AB7]/15"
        >
          {t('dashboard.panoTodayCta')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {hasGoal ? (
        <>
          <p className="mb-3 text-xs font-medium text-[var(--text-2)]">
            {t('hedef.goalSummary', { people: goal!.targetPeople, months: goal!.targetMonths })}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FUNNEL_KEYS.map(key => {
              const target = progress!.targets[key] ?? 0
              const actual = progress!.actuals[key] ?? 0
              const done = target > 0 && actual >= target
              return (
                <div
                  key={key}
                  className={clsx(
                    'rounded-xl border px-3 py-2.5',
                    done
                      ? 'border-emerald-200/60 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                      : 'border-[var(--border)] bg-[var(--bg-subtle)]',
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-3)]">
                    {t(`hedef.${key}`)}
                  </p>
                  <p className={clsx('mt-0.5 text-lg font-bold tabular-nums', done ? 'text-emerald-700 dark:text-emerald-400' : 'text-[var(--text-1)]')}>
                    {actual}
                    <span className="text-sm font-semibold text-[var(--text-3)]"> / {target}</span>
                  </p>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-5 text-center">
          <p className="text-sm text-[var(--text-2)]">{t('dashboard.panoTodayNoGoal')}</p>
          <Link
            href="/bugun/ilgilen?tab=daily"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#534AB7] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#453DA0] active:scale-[0.98]"
          >
            {t('dashboard.panoTodaySetGoal')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </section>
  )
}
