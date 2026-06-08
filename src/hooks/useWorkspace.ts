'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWorkspaceAction, ensureWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { queryKeys } from '@/lib/query/keys'

export interface WorkspaceContext {
  userId: string
  workspaceId: string
  inviteCode: string
  role: 'leader' | 'member'
  fullName: string | null
  avatarUrl: string | null
  licenseType: 'free' | 'basic' | 'plus' | 'pro'
  /** Basic trial credits while license_type is free and trial window active */
  effectiveLicenseType: 'free' | 'basic' | 'plus' | 'pro'
  licenseExpiresAt: string | null
  workspaceCreatedAt: string | null
  isTrialActive: boolean
  isSuperAdmin: boolean
  /** true when this user's workspace is linked to an upline sponsor */
  hasUpline: boolean
  email?: string | null
}

export function useWorkspace() {
  const queryClient = useQueryClient()

  const initMutation = useMutation({
    mutationFn: ensureWorkspaceAction,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.workspace(), data)
    },
  })

  const query = useQuery({
    queryKey: queryKeys.workspace(),
    queryFn: fetchWorkspaceAction,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  useEffect(() => {
    if (
      query.isFetched &&
      query.data === null &&
      !query.isLoading &&
      !initMutation.isPending &&
      !initMutation.isSuccess
    ) {
      initMutation.mutate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.isFetched, query.data, query.isLoading, initMutation.isPending, initMutation.isSuccess])

  const data = initMutation.data ?? query.data ?? undefined
  const isLoading = query.isLoading || (query.data === null && initMutation.isPending)

  return {
    ...query,
    data,
    isLoading,
    isError: query.isError || initMutation.isError,
    error: initMutation.error ?? query.error,
  }
}
