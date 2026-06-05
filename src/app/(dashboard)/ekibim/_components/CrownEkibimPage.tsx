'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Users } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubSectionCard } from '@/lib/ui/hub/HubSectionCard'
import { getCrownTeamPageAction } from '@/app/(dashboard)/crown/actions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { getTeamMemberCardClasses } from '@/lib/ui/teamMemberCard'
import { hasTeamPageAccess } from '@/lib/domain/teamAccess'
import { FeatureUpgradeGate } from '@/components/ui/FeatureUpgradeGate'
import { Skeleton } from '@/components/ui/Skeleton'
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
  const locked = !hasTeamPageAccess(ws?.licenseType, ws?.isSuperAdmin)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'ekibim', ws?.workspaceId],
    queryFn: () => getCrownTeamPageAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId && !locked,
    staleTime: 30_000,
  })

  const rows = data?.rows ?? []
  const activeCount = useMemo(() => {
    const now = Date.now()
    return rows.filter(m => {
      if (!m.last_activity_at) return false
      const days = (now - new Date(m.last_activity_at).getTime()) / 86_400_000
      return days < 7
    }).length
  }, [rows])

  return (
    <HubPageShell
      title={t('crown.myTeam')}
      subtitle={t('crown.teamSubtitle')}
      icon={Users}
      iconClassName="bg-[#FAEEDA] text-[#854F0B] dark:bg-amber-950/30 dark:text-amber-400"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'ekibim'] })}
      refreshing={isFetching}
    >
      {locked ? (
        <FeatureUpgradeGate feature="team" locked>
          {null}
        </FeatureUpgradeGate>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-brand/25 bg-[var(--bg-card)] px-3 py-4 text-center">
              <p className="text-2xl font-black tabular-nums text-brand">{data?.totalTeam ?? 0}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--text-3)]">{t('crown.totalTeam')}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/25 bg-[var(--bg-card)] px-3 py-4 text-center">
              <p className="text-2xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">{activeCount}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--text-3)]">{t('crown.activePeople')}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-violet-500/25 bg-[var(--bg-card)] px-3 py-4 text-center md:col-span-1">
              <p className="text-2xl font-black tabular-nums text-violet-600 dark:text-violet-400">
                {rows.reduce((s, m) => s + m.katildi_count, 0)}
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--text-3)]">{t('crown.totalMembers')}</p>
            </div>
          </div>

          <HubSectionCard title={t('crown.teamRoster')}>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-[var(--text-3)]">{t('crown.emptyTeam')}</p>
            ) : (
              <ul className="space-y-3">
                {rows.map(row => {
                  const videoPct = data?.videoMap[row.user_id]?.pct ?? 0
                  const goal = data?.goalsMap[row.user_id]
                  const isInactive = !row.last_activity_at || (
                    (Date.now() - new Date(row.last_activity_at).getTime()) / 86_400_000 >= 14
                  )
                  return (
                    <li
                      key={row.user_id}
                      className={clsx(
                        'rounded-xl border p-4',
                        getTeamMemberCardClasses(row, isInactive),
                      )}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <PersonAvatar name={row.full_name ?? '?'} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-[var(--text-1)]">{row.full_name ?? '—'}</p>
                            <span
                              className={clsx(
                                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                row.isAppUser === false
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                  : 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
                              )}
                            >
                              {row.isAppUser === false ? t('crown.customer') : t('crown.organization')}
                            </span>
                          </div>
                          {row.phone ? (
                            <p className="mt-0.5 text-xs text-[var(--text-3)]">{row.phone}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-[var(--text-3)]">
                            {t('crown.registered', { date: formatDate(row.joined_at, lang) })}
                          </p>
                        </div>
                      </div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs text-[var(--text-3)]">{t('crown.videoWatching')}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                          <div className="h-full rounded-full bg-teal-600" style={{ width: `${videoPct}%` }} />
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-[var(--text-2)]">%{videoPct}</span>
                      </div>
                      {goal ? (
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-lg bg-[#EEEDFE] px-2 py-0.5 text-xs font-medium text-[#534AB7] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]">
                            {t('crown.goalPeople', { count: goal.targetPeople })}
                          </span>
                          <span className="rounded-lg bg-[#EEEDFE] px-2 py-0.5 text-xs font-medium text-[#534AB7] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]">
                            {t('crown.goalMonths', { count: goal.targetMonths })}
                          </span>
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </HubSectionCard>

          <Link
            href="/ekip"
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3.5 transition hover:bg-[var(--bg-subtle)]"
          >
            <span className="text-sm font-semibold text-[var(--text-1)]">{t('crown.teamManageCta')}</span>
            <ChevronRight className="h-4 w-4 text-[var(--text-3)]" />
          </Link>
        </>
      )}
    </HubPageShell>
  )
}
