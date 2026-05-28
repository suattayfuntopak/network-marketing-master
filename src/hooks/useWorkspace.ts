'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWorkspaceAction, ensureWorkspaceAction } from '@/app/(dashboard)/actions/workspace'

export interface WorkspaceContext {
  userId: string
  workspaceId: string
  inviteCode: string
  role: 'leader' | 'member'
  fullName: string | null
  avatarUrl: string | null
  licenseType: 'free' | 'leader' | 'master' | 'pro'
  licenseExpiresAt: string | null
  isSuperAdmin: boolean
  /** true when this user's workspace is linked to an upline sponsor */
  hasUpline: boolean
}

export function useWorkspace() {
  const queryClient = useQueryClient()

  const initMutation = useMutation({
    mutationFn: ensureWorkspaceAction,
    onSuccess: (data) => {
      queryClient.setQueryData(['workspace'], data)
    },
  })

  const query = useQuery({
    queryKey: ['workspace'],
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
