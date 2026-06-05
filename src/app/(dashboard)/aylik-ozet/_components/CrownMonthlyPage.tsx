'use client'

import { useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarRange } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubSectionCard } from '@/lib/ui/hub/HubSectionCard'
import { TeamActivitySummary } from '@/app/(dashboard)/istatistikler/_components/TeamActivitySummary'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { getCrownEntriesPageAction } from '@/app/(dashboard)/crown/actions'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { queryKeys } from '@/lib/query/keys'
import { Skeleton } from '@/components/ui/Skeleton'

export function CrownMonthlyPage() {
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
  }

  return (
    <HubPageShell
      title={t('crown.monthlyTitle')}
      subtitle={t('crown.monthlySubtitle')}
      icon={CalendarRange}
      iconClassName="bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400"
      onRefresh={refresh}
      refreshing={membersLoading || activityLoading || entriesLoading}
    >
      <TeamActivitySummary
        downlines={downlines}
        activity={activity}
        loading={membersLoading || activityLoading}
        teamStatsLocked={!teamPulseUnlocked}
        getMemberHref={getMemberHref}
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
              {entriesData!.entries.map(entry => (
                <li
                  key={entry.userId}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]/50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-semibold text-[var(--text-1)]">{entry.fullName}</p>
                    <span className="text-xs font-medium text-[var(--text-3)]">
                      {t('crown.entryCount', { count: entry.entryDays })}
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-[var(--text-3)]">
                    {t('crown.lastEntry', { date: entry.lastEntry ?? '—' })}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-[var(--text-2)]">
                    <span>{t('statsPage.kpiTotalCalls')}: <strong className="text-[var(--text-1)]">{entry.calls}</strong></span>
                    <span>{t('pulse.newCandidates')}: <strong className="text-[var(--text-1)]">{entry.newCandidates}</strong></span>
                    <span>{t('pulse.colPresentations')}: <strong className="text-[var(--text-1)]">{entry.presentations}</strong></span>
                    <span>{t('crown.metricMember')}: <strong className="text-[var(--text-1)]">{entry.newMembers}</strong></span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </HubSectionCard>
      )}
    </HubPageShell>
  )
}
