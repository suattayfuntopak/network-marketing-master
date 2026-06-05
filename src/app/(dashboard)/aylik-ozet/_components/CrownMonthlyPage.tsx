'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { CrownPageShell } from '@/lib/ui/crown/CrownPageShell'
import { CrownCard } from '@/lib/ui/crown/CrownCard'
import { getCrownMonthlyPageAction, getCrownEntriesPageAction } from '@/app/(dashboard)/crown/actions'
import { clsx } from 'clsx'

const ACCENT = ['border-t-[#1a365d]', 'border-t-emerald-500', 'border-t-sky-500', 'border-t-amber-500']

export function CrownMonthlyPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const wid = ws?.workspaceId

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'monthly', wid],
    queryFn: () => getCrownMonthlyPageAction(wid!),
    enabled: !!wid,
  })

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['crown', 'entries', wid],
    queryFn: () => getCrownEntriesPageAction(wid!),
    enabled: !!wid,
  })

  const members = data?.members ?? []
  const activity = data?.activity
  const byUser = activity?.byUser ?? {}
  const activeCount = Object.values(byUser).filter(r => r.activeDays > 0).length

  const statCards = [
    { label: t('crown.teamMembers'), value: members.length },
    { label: t('crown.activePeople'), value: activeCount },
    { label: t('crown.totalCalls'), value: activity?.totals.calls ?? 0 },
    { label: t('crown.totalMembers'), value: data?.joinedInPeriod ?? 0 },
  ]

  function refresh() {
    qc.invalidateQueries({ queryKey: ['crown', 'monthly'] })
    qc.invalidateQueries({ queryKey: ['crown', 'entries'] })
  }

  return (
    <CrownPageShell
      title={t('crown.monthlyTitle')}
      emoji="📅"
      onRefresh={refresh}
      refreshing={isFetching}
    >
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((s, i) => (
            <CrownCard key={s.label} className={clsx('border-t-4 pt-3 text-center', ACCENT[i])}>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </CrownCard>
          ))}
        </div>
      )}

      <CrownCard>
        <h2 className="mb-4 text-sm font-bold text-slate-800">📝 {t('crown.entries')}</h2>
        {entriesLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-50" />
            ))}
          </div>
        ) : (entriesData?.entries.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-500">{t('crown.emptyTeam')}</p>
        ) : (
          <div className="space-y-3">
            {entriesData!.entries.map(entry => (
              <div key={entry.userId} className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-800">{entry.fullName}</p>
                  <span className="text-xs text-slate-500">{t('crown.entryCount', { count: entry.entryDays })}</span>
                </div>
                <p className="mb-3 text-xs text-slate-500">
                  📅 {t('crown.lastEntry', { date: entry.lastEntry ?? '—' })}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-slate-700">
                  <span>📞 {entry.calls}</span>
                  <span>🤝 {entry.newCandidates}</span>
                  <span>📋 {entry.presentations}</span>
                  <span>👥 {entry.newMembers}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CrownCard>
    </CrownPageShell>
  )
}
