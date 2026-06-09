'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useEkipPanelRows } from '@/hooks/useTeamMembers'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  HubSummaryTabBar,
  parseSummaryTab,
  type HubPeriodTab,
} from '@/components/hub/HubSummaryTabBar'
import { getTeamRankingMetricsAction } from '@/app/(dashboard)/istatistikler/teamActivityActions'
import { hasTeamPulseAccess } from '@/lib/domain/teamAccess'
import type { PulsePeriod } from '@/lib/domain/pulse'
import { queryKeys } from '@/lib/query/keys'
import { TeamFieldRankingTable } from './TeamFieldRankingTable'
import { TeamFreeUpgradeBanner } from './TeamFreeUpgradeBanner'

function mapSummaryTabToPulse(tab: HubPeriodTab): PulsePeriod {
  if (tab === 'daily') return 'today'
  if (tab === 'weekly') return '7d'
  if (tab === 'monthly') return '30d'
  return 'ytd'
}

export function EkipSummaryTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: ws } = useWorkspace()
  const { data: members = [], isLoading: membersLoading } = useEkipPanelRows(ws?.workspaceId)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const periodTab = parseSummaryTab(searchParams.get('period'))
  const pulsePeriod = mapSummaryTabToPulse(periodTab)

  useEffect(() => {
    if (searchParams.get('period') !== 'all') return
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'summary')
    params.set('period', 'yearly')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router, searchParams])

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

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: queryKeys.teamRankingMetrics(ws?.workspaceId ?? '', pulsePeriod, memberIds),
    queryFn: () => getTeamRankingMetricsAction(ws!.workspaceId, pulsePeriod, memberIds),
    enabled: !!ws?.workspaceId && memberIds.length > 0 && teamPulseUnlocked,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (!ws?.workspaceId || memberIds.length === 0 || !teamPulseUnlocked) return
    const periods: PulsePeriod[] = ['today', '7d', '30d', 'ytd']
    for (const p of periods) {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.teamRankingMetrics(ws.workspaceId, p, memberIds),
        queryFn: () => getTeamRankingMetricsAction(ws.workspaceId, p, memberIds),
        staleTime: 60_000,
      })
    }
  }, [ws?.workspaceId, memberIds, teamPulseUnlocked, queryClient])

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
    <div
      className="max-w-full min-w-0 space-y-4 overflow-x-clip overscroll-x-none touch-pan-y no-swipe"
      data-no-swipe="true"
      onTouchStart={e => e.stopPropagation()}
    >
      <HubSummaryTabBar active={periodTab} onChange={setPeriodTab} />
      <TeamFieldRankingTable
        downlines={downlines}
        metrics={metrics}
        loading={membersLoading || metricsLoading}
        getMemberHref={getMemberHref}
      />
    </div>
  )
}
