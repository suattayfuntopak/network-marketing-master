'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { CrownPageShell } from '@/lib/ui/crown/CrownPageShell'
import { CrownCard } from '@/lib/ui/crown/CrownCard'
import { getCrownWeeklyPageAction } from '@/app/(dashboard)/crown/actions'
import { clsx } from 'clsx'

const ACCENT = ['border-t-[#1a365d]', 'border-t-emerald-500', 'border-t-sky-500', 'border-t-amber-500']

export function CrownWeeklyPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'weekly', ws?.workspaceId],
    queryFn: () => getCrownWeeklyPageAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
  })

  const members = data?.members ?? []
  const activity = data?.activity
  const byUser = activity?.byUser ?? {}
  const activeCount = Object.values(byUser).filter(r => r.activeDays > 0).length
  const maxCalls = Math.max(1, ...Object.values(byUser).map(r => r.calls))

  const ranked = [...members]
    .map(m => ({
      member: m,
      calls: byUser[m.user_id]?.calls ?? 0,
      newCand: byUser[m.user_id]?.newCandidates ?? 0,
      days: byUser[m.user_id]?.activeDays ?? 0,
      joined: m.katildi_count,
    }))
    .sort((a, b) => b.calls - a.calls || b.newCand - a.newCand)

  const statCards = [
    { label: t('crown.teamMembers'), value: members.length },
    { label: t('crown.activePeople'), value: activeCount },
    { label: t('crown.totalCalls'), value: activity?.totals.calls ?? 0 },
    { label: t('crown.totalMembers'), value: data?.joinedInPeriod ?? 0 },
  ]

  return (
    <CrownPageShell
      title={t('crown.weeklyTitle')}
      emoji="📊"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'weekly'] })}
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
        <h2 className="mb-4 text-sm font-bold text-slate-800">📞 {t('crown.callsByPerson')}</h2>
        <div className="space-y-3">
          {ranked.slice(0, 10).map(({ member, calls }) => (
            <div key={member.user_id} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-sm text-slate-700">{member.full_name ?? '—'}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#1a365d]"
                  style={{ width: `${Math.round((calls / maxCalls) * 100)}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-semibold text-slate-700">{calls}</span>
            </div>
          ))}
        </div>
      </CrownCard>

      <CrownCard>
        <h2 className="mb-4 text-sm font-bold text-slate-800">🏆 {t('crown.ranking')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 pr-2">#</th>
                <th className="pb-2 pr-2">İsim</th>
                <th className="pb-2 px-1 text-center">📞</th>
                <th className="pb-2 px-1 text-center">🤝</th>
                <th className="pb-2 px-1 text-center">📅</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row, i) => (
                <tr
                  key={row.member.user_id}
                  className={clsx('border-t border-slate-100', i === 0 && 'bg-amber-50/80')}
                >
                  <td className="py-2.5 pr-2 text-slate-500">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                  <td className="max-w-[120px] truncate py-2.5 pr-2 font-medium text-slate-800">
                    {row.member.full_name ?? '—'}
                  </td>
                  <td className="py-2.5 px-1 text-center font-semibold text-sky-700">{row.calls}</td>
                  <td className="py-2.5 px-1 text-center font-semibold text-violet-700">{row.newCand}</td>
                  <td className="py-2.5 px-1 text-center text-slate-600">{row.days}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CrownCard>
    </CrownPageShell>
  )
}
