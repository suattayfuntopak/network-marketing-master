'use client'

import { useCallback, useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useWorkspace } from '@/hooks/useWorkspace'
import type { MemberRow } from '@/lib/team/types'
import {
  HubSummaryTabBar,
  parseSummaryTab,
  type HubPeriodTab,
} from '@/components/hub/HubSummaryTabBar'
import { getTeamRankingMetricsBatchAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import type { PulsePeriod } from '@/lib/domain/pulse'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { TeamFieldRankingTable } from './TeamFieldRankingTable'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'

function mapSummaryTabToPulse(tab: HubPeriodTab): PulsePeriod {
  if (tab === 'daily') return 'today'
  if (tab === 'weekly') return '7d'
  if (tab === 'monthly') return '30d'
  if (tab === 'all') return 'all'
  return 'ytd'
}

type EkipSummaryTabProps = {
  members?: MemberRow[]
  membersLoading?: boolean
}

export function EkipSummaryTab({
  members: membersProp = [],
  membersLoading: membersLoadingProp = false,
}: EkipSummaryTabProps = {}) {
  const { data: ws } = useWorkspace()
  const members = membersProp
  const membersLoading = membersLoadingProp
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const periodTab = parseSummaryTab(searchParams.get('period'))
  const pulsePeriod = mapSummaryTabToPulse(periodTab)

  const setPeriodTab = useCallback(
    (next: HubPeriodTab) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', 'summary')
      params.set('period', next)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const downlines = useMemo(
    () => members.filter(m => m.role !== 'leader' && m.isAppUser !== false),
    [members],
  )

  const memberIds = useMemo(() => downlines.map(m => m.user_id), [downlines])
  const teamPulseUnlocked = hasTeamPulseAccess(ws?.licenseType, ws?.isSuperAdmin)

  const { data: batch, isLoading: metricsLoading, isFetching: metricsFetching } = useQuery({
    queryKey: queryKeys.teamRankingMetricsBatch(ws?.workspaceId ?? '', memberIds),
    queryFn: () => getTeamRankingMetricsBatchAction(ws!.workspaceId, memberIds),
    enabled: !!ws?.workspaceId && memberIds.length > 0 && teamPulseUnlocked,
    staleTime: QUERY_STALE.metrics,
    placeholderData: keepPreviousData,
  })

  const metrics = batch?.[pulsePeriod]

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
      </div>
    )
  }

  return (
    <div
      className="max-w-full min-w-0 space-y-4 overflow-x-clip overscroll-x-none touch-pan-y no-swipe"
      data-no-swipe="true"
      onTouchStart={e => e.stopPropagation()}
    >
      <HubSummaryTabBar active={periodTab} onChange={setPeriodTab} />
      <TeamFieldRankingTable
        downlines={downlines}
        metrics={metrics}
        loading={
          (membersLoading && downlines.length === 0) ||
          (metricsLoading && !batch && metricsFetching)
        }
        getMemberHref={getMemberHref}
      />
    </div>
  )
}
