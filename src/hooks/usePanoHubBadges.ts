'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  getHubWeeklySelfAction,
  getHubMonthlyInsightsAction,
  getCrownFirst30PageAction,
} from '@/app/(dashboard)/crown/actions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { queryKeys } from '@/lib/query/keys'

/** Haftalık / aylık / ilk-30 pano rozetleri — dashboard prefetch ile anında hazır. */
export function usePanoHubBadges() {
  const { data: ws } = useWorkspace()
  const { hasTeamFullAccess } = useFeatureAccess()
  const workspaceId = ws?.workspaceId

  const weekly = useQuery({
    queryKey: queryKeys.hubWeeklySelf(),
    queryFn: getHubWeeklySelfAction,
    staleTime: 60_000,
  })

  const monthly = useQuery({
    queryKey: queryKeys.hubMonthlyInsights(),
    queryFn: getHubMonthlyInsightsAction,
    staleTime: 60_000,
  })

  const first30 = useQuery({
    queryKey: queryKeys.crownFirst30(workspaceId ?? ''),
    queryFn: () => getCrownFirst30PageAction(workspaceId!),
    enabled: !!workspaceId && hasTeamFullAccess,
    staleTime: 60_000,
  })

  const first30ActiveCount = useMemo(() => {
    if (!hasTeamFullAccess || !first30.data) return null
    return first30.data.members.filter(m => m.daysLeft > 0 && m.pct < 100).length
  }, [hasTeamFullAccess, first30.data])

  return {
    weekly: weekly.data,
    monthly: monthly.data,
    first30ActiveCount,
  }
}
