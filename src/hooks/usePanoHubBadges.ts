'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  getHubWeeklySelfAction,
  getHubMonthlyInsightsAction,
} from '@/app/(dashboard)/crown/hubSelfActions'
import { getCrownSahaRadarAction } from '@/app/(dashboard)/saha-radar/actions'
import { useWorkspace } from '@/hooks/useWorkspace'
import { queryKeys } from '@/lib/query/keys'

/** Haftalık / aylık / saha-radar pano rozetleri — dashboard prefetch ile anında hazır. */
export function usePanoHubBadges() {
  const { data: ws } = useWorkspace()
  const workspaceId = ws?.workspaceId

  const weekly = useQuery({
    queryKey: queryKeys.hubWeeklySelf(0),
    queryFn: () => getHubWeeklySelfAction(0),
    staleTime: 60_000,
  })

  const monthly = useQuery({
    queryKey: queryKeys.hubMonthlyInsights(0),
    queryFn: getHubMonthlyInsightsAction,
    staleTime: 60_000,
  })

  const sahaRadar = useQuery({
    queryKey: queryKeys.crownSahaRadar(workspaceId ?? ''),
    queryFn: () => getCrownSahaRadarAction(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  })

  // Badge: bugün/geçmiş takip sayısı (yalnızca liderin kendi boru hattı)
  const sahaRadarBadgeCount = useMemo(() => {
    if (!sahaRadar.data) return null
    const count = sahaRadar.data.followUps.filter(f => f.isOverdue).length
    return count > 0 ? count : null
  }, [sahaRadar.data])

  return {
    weekly: weekly.data,
    monthly: monthly.data,
    sahaRadarBadgeCount,
  }
}
