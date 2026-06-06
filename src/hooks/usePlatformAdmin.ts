'use client'

import { useQuery } from '@tanstack/react-query'
import { getPlatformWorkspacesAction } from '@/app/(dashboard)/platform-yonetim/actions'
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
