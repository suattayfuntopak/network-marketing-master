'use client'

import { useMemo, useCallback } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HubWeekHero } from '@/lib/ui/hub/HubWeekHero'
import { HubWeekLoginStrip } from '@/lib/ui/hub/HubWeekLoginStrip'
import { HubCrownFunnelGrid } from '@/lib/ui/hub/HubCrownFunnelGrid'
import { HubPeriodTeamPanel } from '@/lib/ui/hub/HubPeriodTeamPanel'
import { PanoWeeklyLite } from '@/app/(dashboard)/pano/_components/PanoWeeklyLite'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { getCrownWeeklyPageAction, getHubWeeklySelfAction } from '@/app/(dashboard)/crown/actions'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { queryKeys } from '@/lib/query/keys'
import { weeklyAccent } from './weeklyTheme'

export function CrownWeeklyPage({ asTab = false }: { asTab?: boolean }) {
  const { t } = useTranslation()
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

  const { data: weeklySelf, isLoading: weeklySelfLoading } = useQuery({
    queryKey: queryKeys.hubWeeklySelf(),
    queryFn: getHubWeeklySelfAction,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const { data: crownWeekly, isLoading: crownWeeklyLoading } = useQuery({
    queryKey: ['crown', 'weekly-page', wid],
    queryFn: () => getCrownWeeklyPageAction(wid!),
    enabled: !!wid && teamPulseUnlocked,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: queryKeys.teamFieldActivity(wid ?? '', '7d', activityMemberIds),
    queryFn: () => getTeamFieldActivityAction(wid!, '7d', activityMemberIds),
    enabled: !!wid && activityMemberIds.length > 0 && teamPulseUnlocked,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const teamActivity = crownWeekly?.activity ?? activity
  const joinedInPeriod = crownWeekly?.joinedInPeriod ?? 0

  const getMemberHref = useCallback(
    (row: { user_id: string }) => {
      const m = members.find(x => x.user_id === row.user_id)
      return m?.pipeline_id ? `/pipeline/${m.pipeline_id}` : null
    },
    [members],
  )

  const selfLoading = weeklySelfLoading && !weeklySelf
  const weekActive = weeklySelf?.weekActive ?? Array.from({ length: 7 }, () => false)

  return (
    <HubPageShell
      title={t('dashboard.crownMockWeeklySummary')}
      icon={BarChart3}
      iconClassName={weeklyAccent.icon}
      backHref="/pano"
      showRefresh={false}
      asTab={asTab}
    >
      <div className="space-y-4">
        <HubWeekHero loading={selfLoading} />
        <HubWeekLoginStrip
          weekActive={weekActive}
          loginDays={weeklySelf?.loginDays ?? 0}
          loading={selfLoading}
        />
        <HubCrownFunnelGrid
          actuals={weeklySelf?.weeklyActuals ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
          targets={weeklySelf?.weeklyTargets ?? { arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 }}
          hasGoal={weeklySelf?.hasGoal ?? false}
          period="weekly"
          loading={selfLoading}
        />
        <div className="space-y-3">
          <h2 className="text-base font-bold text-[var(--text-1)]">{t('crown.hubCandidateTrend')}</h2>
          <PanoWeeklyLite />
        </div>
        <HubPeriodTeamPanel
          downlines={downlines}
          activity={teamActivity}
          loading={membersLoading || ((activityLoading || crownWeeklyLoading) && !teamActivity)}
          teamStatsLocked={!teamPulseUnlocked}
          joinedInPeriod={joinedInPeriod}
          period="7d"
          getMemberHref={getMemberHref}
        />
      </div>
    </HubPageShell>
  )
}
