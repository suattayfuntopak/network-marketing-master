'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Users } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/components/hub/HubPageShell'
import { HubSectionCard } from '@/components/hub/HubSectionCard'
import { HubKpiRow } from '@/components/hub/HubKpiRow'
import { getCrownTeamPageAction } from '@/app/(dashboard)/crown/actions'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { getTeamMemberCardClasses } from '@/lib/ui/teamMemberCard'

import { Skeleton } from '@/components/ui/Skeleton'
import { waHref } from '@/lib/utils/waLink'

function formatDate(iso: string | null | undefined, lang: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR')
  } catch {
    return iso.slice(0, 10)
  }
}

function daysSince(iso: string | null | undefined): number {
  if (!iso) return Infinity
  return (Date.now() - new Date(iso).getTime()) / 86_400_000
}

function memberTrackStatus(
  lastActivity: string | null | undefined,
  videoPct: number,
): 'onTrack' | 'behind' | 'neutral' {
  const days = daysSince(lastActivity)
  if (days < 7) return 'onTrack'
  if (days >= 14) return 'behind'
  if (videoPct >= 30) return 'neutral'
  return 'behind'
}

export function CrownEkibimPage({ asTab = false }: { asTab?: boolean }) {
  const { t, lang } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['crown', 'ekibim', ws?.workspaceId],
    queryFn: () => getCrownTeamPageAction(ws!.workspaceId),
    enabled: !!ws?.workspaceId,
    staleTime: 30_000,
  })

  const rows = data?.rows ?? []
  const stats = data?.stats

  const kpiItems = useMemo(
    () => [
      {
        label: t('crown.teamMembers'),
        value: data?.totalTeam ?? 0,
        valueClass: 'text-brand',
        borderClass: 'border-t-4 border-brand/25',
      },
      {
        label: t('crown.activePeople'),
        value: stats?.activeCount ?? 0,
        valueClass: 'text-emerald-600 dark:text-emerald-400',
        borderClass: 'border-t-4 border-emerald-500/25',
      },
      {
        label: t('crown.totalCalls'),
        value: stats?.weeklyCalls ?? 0,
        valueClass: 'text-blue-600 dark:text-blue-400',
        borderClass: 'border-t-4 border-blue-500/25',
      },
      {
        label: t('crown.totalMembers'),
        value: stats?.newMembersWeek ?? 0,
        valueClass: 'text-violet-600 dark:text-violet-400',
        borderClass: 'border-t-4 border-violet-500/25',
      },
    ],
    [data?.totalTeam, stats, t],
  )

  return (
    <HubPageShell
      title={t('crown.myTeam')}
      subtitle={t('crown.teamSubtitle')}
      icon={Users}
      iconClassName="bg-[#FAEEDA] text-[#854F0B] dark:bg-amber-950/30 dark:text-amber-400"
      onRefresh={() => qc.invalidateQueries({ queryKey: ['crown', 'ekibim'] })}
      refreshing={isFetching}
      asTab={asTab}
    >
      <>
          <HubKpiRow items={kpiItems} />

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
                  const inactiveDays = daysSince(row.last_activity_at)
                  const isSilent = inactiveDays >= 14
                  const track = memberTrackStatus(row.last_activity_at, videoPct)
                  const wa = waHref(row.phone)
                  return (
                    <li
                      key={row.user_id}
                      className={clsx(
                        'rounded-xl border p-4',
                        getTeamMemberCardClasses(row, isSilent),
                      )}
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <PersonAvatar name={row.full_name ?? '?'} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-semibold text-[var(--text-1)]">{row.full_name ?? '—'}</p>
                            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                              {isSilent ? (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                  {t('crown.silentBadge', { days: Math.floor(inactiveDays) })}
                                </span>
                              ) : null}
                              <span
                                className={clsx(
                                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                  track === 'onTrack'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : track === 'behind'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                                )}
                              >
                                {track === 'onTrack'
                                  ? t('crown.onTrack')
                                  : track === 'behind'
                                    ? t('crown.behind')
                                    : t('crown.neutral')}
                              </span>
                              <span
                                className={clsx(
                                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                  row.isAppUser === false
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                    : 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300',
                                )}
                              >
                                {row.isAppUser === false ? t('crown.customer') : t('crown.organization')}
                              </span>
                            </div>
                          </div>
                          {row.phone ? (
                            <p className="mt-0.5 text-xs text-[var(--text-3)]">{row.phone}</p>
                          ) : null}
                          <p className="mt-1 text-xs text-[var(--text-3)]">
                            {t('crown.registered', { date: formatDate(row.joined_at, lang) })}
                          </p>
                        </div>
                        {wa ? (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#25D366]/30 bg-whatsapp/5 text-[#128C7E] transition hover:bg-whatsapp/10"
                            title={t('crown.openWa')}
                          >
                            <WhatsAppIcon className="h-4 w-4" />
                          </a>
                        ) : null}
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
                          <span className="rounded-lg bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand dark:bg-[#1e1b4b] dark:text-[#a5b4fc]">
                            {t('crown.goalPeople', { count: goal.targetPeople })}
                          </span>
                          <span className="rounded-lg bg-brand-subtle px-2 py-0.5 text-xs font-medium text-brand dark:bg-[#1e1b4b] dark:text-[#a5b4fc]">
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
    </HubPageShell>
  )
}
