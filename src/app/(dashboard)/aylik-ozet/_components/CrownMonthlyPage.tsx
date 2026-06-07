'use client'

import { useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarRange } from 'lucide-react'
import { clsx } from 'clsx'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubSectionCard } from '@/lib/ui/hub/HubSectionCard'
import { HubMonthProgress } from '@/lib/ui/hub/HubMonthProgress'
import { TeamActivitySummary } from '@/app/(dashboard)/istatistikler/_components/TeamActivitySummary'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { getCrownEntriesPageAction, getHubMonthlyInsightsAction } from '@/app/(dashboard)/crown/actions'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { queryKeys } from '@/lib/query/keys'
import { Skeleton } from '@/components/ui/Skeleton'

function daysSinceDate(iso: string | null): number {
  if (!iso) return Infinity
  return (Date.now() - new Date(iso).getTime()) / 86_400_000
}

export function CrownMonthlyPage({ asTab = false }: { asTab?: boolean }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const wid = ws?.workspaceId
  const { data: members = [], isLoading: membersLoading } = useEkipPanelRows(wid)

  const downlines = useMemo(
    () => members.filter(m => m.role !== 'leader' && m.isAppUser !== false),
    [members],
  )
  const activityMemberIds = useMemo(
    () => downlines.map(m => m.user_id).filter(Boolean),
    [downlines],
  )

  const teamPulseUnlocked = hasTeamPulseAccess(ws?.licenseType, ws?.isSuperAdmin)

  const { data: monthInsights, isLoading: monthLoading } = useQuery({
    queryKey: queryKeys.hubMonthlyInsights(),
    queryFn: getHubMonthlyInsightsAction,
    staleTime: 30_000,
  })

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: queryKeys.teamFieldActivity(wid ?? '', '30d', activityMemberIds),
    queryFn: () => getTeamFieldActivityAction(wid!, '30d', activityMemberIds),
    enabled: !!wid && activityMemberIds.length > 0 && teamPulseUnlocked,
    staleTime: 30_000,
  })

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryKey: ['crown', 'entries', wid],
    queryFn: () => getCrownEntriesPageAction(wid!),
    enabled: !!wid && teamPulseUnlocked,
    staleTime: 30_000,
  })

  const getMemberHref = useCallback(
    (row: { user_id: string }) => {
      const m = members.find(x => x.user_id === row.user_id)
      return m?.pipeline_id ? `/pipeline/${m.pipeline_id}` : null
    },
    [members],
  )

  function refresh() {
    qc.invalidateQueries({ queryKey: ['team-field-activity'] })
    qc.invalidateQueries({ queryKey: ['crown', 'entries'] })
    qc.invalidateQueries({ queryKey: queryKeys.hubMonthlyInsights() })
  }

  return (
    <HubPageShell
      title={t('dashboard.crownMockMonthlySummary')}
      subtitle={t('crown.monthlySubtitle')}
      icon={CalendarRange}
      iconClassName="bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400"
      backHref="/pano"
      onRefresh={refresh}
      refreshing={membersLoading || activityLoading || entriesLoading || monthLoading}
      asTab={asTab}
    >
      <HubMonthProgress data={monthInsights} loading={monthLoading} />

      <TeamActivitySummary
        downlines={downlines}
        activity={activity}
        loading={membersLoading || activityLoading}
        teamStatsLocked={!teamPulseUnlocked}
        getMemberHref={getMemberHref}
        defaultRankingOpen
      />

      {teamPulseUnlocked && (
        <HubSectionCard title={t('crown.entries')}>
          {entriesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (entriesData?.entries.length ?? 0) === 0 ? (
            <p className="text-sm text-[var(--text-3)]">{t('crown.emptyTeam')}</p>
          ) : (
            <ul className="space-y-3">
              {entriesData!.entries.map(entry => {
                const daysSinceEntry = daysSinceDate(entry.lastEntry)
                const atRisk = daysSinceEntry >= 7
                return (
                  <li
                    key={entry.userId}
                    className={clsx(
                      'rounded-xl border p-4',
                      atRisk
                        ? 'border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-[var(--border)] bg-[var(--bg-subtle)]/50',
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--text-1)]">{entry.fullName}</p>
                      <span className="rounded-full bg-[var(--bg-card)] px-2 py-0.5 text-xs font-semibold text-[var(--text-2)]">
                        {t('crown.entryCount', { count: entry.entryDays })}
                      </span>
                    </div>
                    <p
                      className={clsx(
                        'mb-3 flex items-center gap-1.5 text-xs font-medium',
                        atRisk ? 'text-rose-700 dark:text-rose-400' : 'text-[var(--text-3)]',
                      )}
                    >
                      {atRisk ? <span aria-hidden>🔴</span> : null}
                      {atRisk
                        ? t('crown.lastEntryRisk', { date: entry.lastEntry ?? '—', days: Math.floor(daysSinceEntry) })
                        : t('crown.lastEntry', { date: entry.lastEntry ?? '—' })}
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-[var(--text-2)]">
                        📞 {entry.calls}
                      </span>
                      <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-[var(--text-2)]">
                        👤 {entry.newCandidates}
                      </span>
                      <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-[var(--text-2)]">
                        📊 {entry.presentations}
                      </span>
                      <span className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-[var(--text-2)]">
                        ✓ {entry.newMembers}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </HubSectionCard>
      )}
    </HubPageShell>
  )
}
