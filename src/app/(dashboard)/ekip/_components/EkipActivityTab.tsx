'use client'

import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { useTranslation } from '@/providers/LanguageProvider'
import { TeamActivitySummary } from '@/app/(dashboard)/istatistikler/_components/TeamActivitySummary'
import { getTeamFieldActivityAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import { queryKeys } from '@/lib/query/keys'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'

export function EkipActivityTab() {
  const { t } = useTranslation()
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
      if (m?.pipeline_id) return `/pipeline/${m.pipeline_id}`
      return null
    },
    [members],
  )

  if (!teamPulseUnlocked) {
    return (
      <div className="space-y-4">
        <TeamFreeUpgradeBanner />
        <p className="text-sm text-[var(--text-2)]">{t('team.activityLockedHint')}</p>
      </div>
    )
  }

  return (
    <TeamActivitySummary
      downlines={downlines}
      activity={activity}
      loading={membersLoading || activityLoading}
      teamStatsLocked={false}
      getMemberHref={getMemberHref}
      defaultRankingOpen
    />
  )
}
