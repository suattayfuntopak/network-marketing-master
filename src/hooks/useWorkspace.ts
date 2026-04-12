import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { bootstrapWorkspaceForCurrentUser, fetchWorkspaceContext, fetchWorkspaceMembers } from '@/lib/workspace/queries'

export const workspaceKeys = {
  all: ['workspace'] as const,
  context: (userId: string) => [...workspaceKeys.all, 'context', userId] as const,
  members: (workspaceId: string) => [...workspaceKeys.all, 'members', workspaceId] as const,
}

export function useWorkspaceContext(userId: string) {
  return useQuery({
    queryKey: workspaceKeys.context(userId),
    queryFn: () => fetchWorkspaceContext(userId),
    enabled: !!userId,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useWorkspaceMembers(workspaceId: string, currentUserId: string) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId),
    queryFn: () => fetchWorkspaceMembers(workspaceId, currentUserId),
    enabled: !!workspaceId && !!currentUserId,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useBootstrapWorkspace(userId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: () => bootstrapWorkspaceForCurrentUser(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.context(userId) })
      qc.invalidateQueries({ queryKey: workspaceKeys.all })
    },
  })
}
