'use client'

import { useQuery } from '@tanstack/react-query'
import { getPlatformWorkspacesAction, getViralKpiAction, getPlatformProductFunnelAction, getAiUsageAnalyticsAction } from '@/app/(dashboard)/platform-yonetim/actions'
import { getPendingRequestsAction } from '@/app/(dashboard)/actions/moderation'

export function usePlatformWorkspaces(enabled: boolean) {
  return useQuery({
    queryKey: ['platform-workspaces'],
    queryFn: getPlatformWorkspacesAction,
    enabled,
    staleTime: 120_000,
  })
}

export function usePlatformModeration(enabled: boolean) {
  return useQuery({
    queryKey: ['platform-moderation'],
    queryFn: getPendingRequestsAction,
    enabled,
    staleTime: 60_000,
  })
}

export function usePlatformViralKpi(enabled: boolean) {
  return useQuery({
    queryKey: ['platform-viral-kpi'],
    queryFn: getViralKpiAction,
    enabled,
    staleTime: 120_000,
  })
}

export function usePlatformProductFunnel(enabled: boolean) {
  return useQuery({
    queryKey: ['platform-product-funnel'],
    queryFn: getPlatformProductFunnelAction,
    enabled,
    staleTime: 120_000,
  })
}

export function usePlatformAiUsage(enabled: boolean) {
  return useQuery({
    queryKey: ['platform-ai-usage'],
    queryFn: getAiUsageAnalyticsAction,
    enabled,
    staleTime: 120_000,
  })
}
