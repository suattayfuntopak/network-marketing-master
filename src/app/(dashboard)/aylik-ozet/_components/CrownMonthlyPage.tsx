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
import { HubMonthHero } from '@/lib/ui/hub/HubMonthHero'
import { HubCrownFunnelGrid } from '@/lib/ui/hub/HubCrownFunnelGrid'
import { HubPeriodTeamPanel } from '@/lib/ui/hub/HubPeriodTeamPanel'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import {
  getCrownEntriesPageAction,
  getCrownMonthlyPageAction,
  getHubMonthlyInsightsAction,
  getHubMonthlySelfAction,
} from '@/app/(dashboard)/crown/actions'
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

  const { data: monthlySelf, isLoading: monthlySelfLoading } = useQuery({
    queryKey: queryKeys.hubMonthlySelf(),
    queryFn: getHubMonthlySelfAction,
    staleTime: 30_000,
  })

  const { data: monthInsights, isLoading: monthInsightsLoading } = useQuery({
    queryKey: queryKeys.hubMonthlyInsights(),
    queryFn: getHubMonthlyInsightsAction,
    staleTime: 30_000,
  })

  const { data: crownMonthly, isLoading: crownMonthlyLoading } = useQuery({
    queryKey: ['crown', 'monthly-page', wid],
    queryFn: () => getCrownMonthlyPageAction(wid!),
    enabled: !!wid && teamPulseUnlocked,
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

  const teamActivity = crownMonthly?.activity ?? activity
  const joinedInPeriod = crownMonthly?.joinedInPeriod ?? 0

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
    qc.invalidateQueries({ queryKey: ['crown', 'monthly-page'] })
    qc.invalidateQueries({ queryKey: queryKeys.hubMonthlyInsights() })
    qc.invalidateQueries({ queryKey: queryKeys.hubMonthlySelf() })
  }

  const heroLoading = monthlySelfLoading || monthInsightsLoading

  return (
    <HubPageShell
      title={t('dashboard.crownMockMonthlySummary')}
      subtitle={t('crown.monthlySubtitle')}
      icon={CalendarRange}
      iconClassName="bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400"
      backHref="/pano"
      onRefresh={refresh}
      refreshing={
        membersLoading || activityLoading || entriesLoading || monthlySelfLoading || crownMonthlyLoading
      }
      asTab={asTab}
    >
      <div className="space-y-4">
        <HubMonthHero
          loginDays={monthlySelf?.loginDays ?? 0}
          dayOfMonth={monthlySelf?.dayOfMonth ?? monthInsights?.dayOfMonth ?? 1}
          daysInMonth={monthlySelf?.daysInMonth ?? monthInsights?.daysInMonth ?? 30}
          monthPct={monthlySelf?.monthPct ?? monthInsights?.monthPct ?? 0}
          insights={monthInsights}
          loading={heroLoading}
        />
        <HubCrownFunnelGrid
          actuals={monthlySelf?.monthlyActuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
          targets={monthlySelf?.monthlyTargets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
          hasGoal={monthlySelf?.hasGoal ?? false}
          period="monthly"
          loading={monthlySelfLoading}
        />
        <HubPeriodTeamPanel
          downlines={downlines}
          activity={teamActivity}
          loading={membersLoading || activityLoading || crownMonthlyLoading}
          teamStatsLocked={!teamPulseUnlocked}
          joinedInPeriod={joinedInPeriod}
          period="30d"
          getMemberHref={getMemberHref}
        />
        {teamPulseUnlocked ? (
          <HubSectionCard title={t('crown.entries')}>
            {entriesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : (entriesData?.entries.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--text-3)]">{t('crown.emptyTeam')}</p>
            ) : (
              <ul className="space-y-2">
                {entriesData!.entries.map(entry => {
                  const daysSinceEntry = daysSinceDate(entry.lastEntry)
                  const atRisk = daysSinceEntry >= 7
                  return (
                    <li
                      key={entry.userId}
                      className={clsx(
                        'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-3 py-3 md:px-4',
                        atRisk
                          ? 'border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20'
                          : 'border-[var(--border)] bg-[var(--bg-subtle)]/40',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[var(--text-1)]">{entry.fullName}</p>
                        <p
                          className={clsx(
                            'text-xs font-medium',
                            atRisk ? 'text-rose-700 dark:text-rose-400' : 'text-[var(--text-3)]',
                          )}
                        >
                          {atRisk
                            ? t('crown.lastEntryRisk', {
                                date: entry.lastEntry ?? '—',
                                days: Math.floor(daysSinceEntry),
                              })
                            : t('crown.lastEntry', { date: entry.lastEntry ?? '—' })}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--bg-card)] px-2.5 py-0.5 text-xs font-bold text-[var(--text-2)]">
                        {t('crown.entryCount', { count: entry.entryDays })}
                      </span>
                      <div className="flex w-full flex-wrap gap-2 text-xs font-semibold text-[var(--text-2)] sm:w-auto">
                        <span>📞 {entry.calls}</span>
                        <span>👤 {entry.newCandidates}</span>
                        <span>📊 {entry.presentations}</span>
                        <span>✓ {entry.newMembers}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </HubSectionCard>
        ) : null}
      </div>
    </HubPageShell>
  )
}
