'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { CrownPageShell } from '@/lib/ui/crown/CrownPageShell'
import { CrownCard } from '@/lib/ui/crown/CrownCard'
import { getCrownTeamPageAction } from '@/app/(dashboard)/crown/actions'
import { clsx } from 'clsx'

function formatDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR')
  } catch {
    return iso.slice(0, 10)
  }
}

export function CrownEkibimPage() {
  const { t, lang } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'ekibim', ws?.workspaceId],
    queryFn: () => getCrownTeamPageAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
  })

  const rows = data?.rows ?? []

  return (
    <CrownPageShell
      title={t('crown.myTeam')}
      emoji="👥"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'ekibim'] })}
      refreshing={isFetching}
    >
      <CrownCard className="text-center">
        <p className="text-3xl font-bold text-emerald-600">{data?.totalTeam ?? 0}</p>
        <p className="mt-1 text-sm text-slate-500">{t('crown.totalTeam')}</p>
      </CrownCard>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-sm text-slate-600">{t('crown.emptyTeam')}</p>
      ) : (
        rows.map(row => {
          const videoPct = data?.videoMap[row.user_id]?.pct ?? 0
          const goal = data?.goalsMap[row.user_id]
          const isOrg = row.isAppUser !== false
          return (
            <CrownCard
              key={row.user_id}
              className={clsx('border-l-4', isOrg ? 'border-l-amber-400' : 'border-l-emerald-500')}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800">{row.full_name ?? '—'}</p>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white',
                    isOrg ? 'bg-amber-500' : 'bg-emerald-500',
                  )}
                >
                  {isOrg ? t('crown.organization') : t('crown.customer')}
                </span>
              </div>
              {row.phone ? (
                <p className="mb-2 text-sm text-slate-600">📞 {row.phone}</p>
              ) : null}
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${videoPct}%` }} />
                </div>
                <span className="text-xs font-medium text-slate-500">%{videoPct}</span>
              </div>
              <p className="text-xs text-slate-500">{t('crown.registered', { date: formatDate(row.joined_at, lang) })}</p>
              {goal ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                    🎯 {t('crown.goalPeople', { count: goal.targetPeople })}
                  </span>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                    📅 {t('crown.goalMonths', { count: goal.targetMonths })}
                  </span>
                </div>
              ) : null}
              {row.isAppUser ? (
                <p className="mt-2 text-xs font-medium text-emerald-700">✅ {t('crown.invitedDirect')}</p>
              ) : null}
            </CrownCard>
          )
        })
      )}
    </CrownPageShell>
  )
}
