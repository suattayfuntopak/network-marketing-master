'use client'

import { useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3 } from 'lucide-react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { PanoWeeklyLite } from '@/app/(dashboard)/pano/_components/PanoWeeklyLite'
import { TeamActivitySummary } from '@/app/(dashboard)/istatistikler/_components/TeamActivitySummary'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { queryKeys } from '@/lib/query/keys'

export function CrownWeeklyPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: ws } = useWorkspace()
  const { data: members = [], isLoading: membersLoading } = useEkipPanelRows(ws?.workspaceId)

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
    queryKey: queryKeys.teamFieldActivity(ws?.workspaceId ?? '', '7d', activityMemberIds),
    queryFn: () => getTeamFieldActivityAction(ws!.workspaceId, '7d', activityMemberIds),
    enabled: !!ws?.workspaceId && activityMemberIds.length > 0 && teamPulseUnlocked,
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
    qc.invalidateQueries({ queryKey: ['candidates'] })
  }

  return (
    <HubPageShell
      title={t('crown.weeklyTitle')}
      subtitle={t('crown.weeklySubtitle')}
      icon={BarChart3}
      iconClassName="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
      onRefresh={refresh}
      refreshing={membersLoading || activityLoading}
    >
      <PanoWeeklyLite />
      <TeamActivitySummary
        downlines={downlines}
        activity={activity}
        loading={membersLoading || activityLoading}
        teamStatsLocked={!teamPulseUnlocked}
        getMemberHref={getMemberHref}
      />
    </HubPageShell>
  )
}
