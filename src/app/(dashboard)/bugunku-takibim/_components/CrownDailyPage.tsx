'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { CrownPageShell } from '@/lib/ui/crown/CrownPageShell'
import { CrownCard } from '@/lib/ui/crown/CrownCard'
import { getCrownDailyPageAction } from '@/app/(dashboard)/crown/actions'
import { readDayJournal, readDayNote } from '@/lib/domain/dayRitual'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

function pct(actual: number, target: number): number {
  if (target <= 0) return actual > 0 ? 100 : 0
  return Math.min(100, Math.round((actual / target) * 100))
}

export function CrownDailyPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'daily'],
    queryFn: getCrownDailyPageAction,
  })
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!ws?.userId) return
    const journal = readDayJournal(ws.userId)
    const shortNote = readDayNote(ws.userId)
    setNote(journal || shortNote || '')
  }, [ws?.userId])

  const progress = data?.progress
  const goal = data?.goal

  const metrics = progress
    ? [
        { key: 'call', label: t('crown.metricCall'), actual: progress.actuals.arama, target: progress.targets.arama },
        { key: 'meet', label: t('crown.metricMeet'), actual: progress.actuals.tanisma, target: progress.targets.tanisma },
        { key: 'pres', label: t('crown.metricPresentation'), actual: progress.actuals.sunum, target: progress.targets.sunum },
        { key: 'member', label: t('crown.metricMember'), actual: progress.actuals.yeniUye, target: progress.targets.yeniUye },
      ]
    : []

  return (
    <CrownPageShell
      title={t('dashboard.crownMockDailyFollow')}
      emoji="📝"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'daily'] })}
      refreshing={isFetching}
    >
      {goal && progress?.hasGoal ? (
        <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          🎯 {t('crown.goalBanner', { months: goal.targetMonths, people: goal.targetPeople })}
        </div>
      ) : !isLoading ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('crown.noGoal')}</p>
      ) : null}

      <CrownCard>
        <h2 className="mb-4 text-base font-bold text-slate-800">🏆 {t('crown.performanceTitle')}</h2>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {metrics.map(m => {
              const p = pct(m.actual, m.target)
              const done = p >= 100
              return (
                <div key={m.key}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{m.label}</span>
                    <span className={clsx('font-semibold', done ? 'text-emerald-600' : 'text-rose-500')}>%{p}</span>
                  </div>
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={clsx('h-full rounded-full transition-all', done ? 'bg-emerald-500' : 'bg-rose-400')}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-800">
                      {m.actual}
                    </span>
                    <span>{t('crown.targetSuffix', { target: m.target })}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CrownCard>

      <CrownCard>
        <h2 className="mb-3 text-base font-bold text-slate-800">📋 {t('crown.todayNotes')}</h2>
        <p className="min-h-[4rem] whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {note || t('crown.notesEmpty')}
        </p>
      </CrownCard>
    </CrownPageShell>
  )
}
