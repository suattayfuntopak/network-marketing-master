import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bootstrapWorkspaceForCurrentUser,
  fetchWorkspaceContext,
  fetchWorkspaceMembers,
  inviteWorkspaceMember,
  searchWorkspaceInviteCandidates,
  updateWorkspaceRelationship,
  updateWorkspaceMember,
} from '@/lib/workspace/queries'
import type { WorkspaceMember } from '@/lib/workspace/types'

export const workspaceKeys = {
  all: ['workspace'] as const,
  context: (userId: string) => [...workspaceKeys.all, 'context', userId] as const,
  members: (workspaceId: string) => [...workspaceKeys.all, 'members', workspaceId] as const,
  pendingMembers: (workspaceId: string) => [...workspaceKeys.all, 'pending-members', workspaceId] as const,
  inviteSearch: (workspaceId: string, query: string) => [...workspaceKeys.all, 'invite-search', workspaceId, query] as const,
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

export function useWorkspacePendingMembers(workspaceId: string, currentUserId: string) {
  return useQuery({
    queryKey: workspaceKeys.pendingMembers(workspaceId),
    queryFn: () => fetchWorkspaceMembers(workspaceId, currentUserId, ['invited']),
    enabled: !!workspaceId && !!currentUserId,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useWorkspaceInviteCandidates(workspaceId: string, currentUserId: string, query: string) {
  const normalizedQuery = query.trim()

  return useQuery({
    queryKey: workspaceKeys.inviteSearch(workspaceId, normalizedQuery),
    queryFn: () => searchWorkspaceInviteCandidates(workspaceId, normalizedQuery, currentUserId),
    enabled: !!workspaceId && !!currentUserId && normalizedQuery.length >= 2,
    staleTime: 15_000,
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

export function useUpdateWorkspaceMember(userId: string, workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string
      data: Partial<Pick<WorkspaceMember, 'role' | 'status'>>
    }) => updateWorkspaceMember(memberId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.context(userId) })
      qc.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) })
      qc.invalidateQueries({ queryKey: workspaceKeys.all })
    },
  })
}

export function useInviteWorkspaceMember(userId: string, workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      candidateUserId,
      role,
    }: {
      candidateUserId: string
      role: WorkspaceMember['role']
    }) => inviteWorkspaceMember({ workspaceId, candidateUserId, invitedBy: userId, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.context(userId) })
      qc.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) })
      qc.invalidateQueries({ queryKey: workspaceKeys.pendingMembers(workspaceId) })
      qc.invalidateQueries({ queryKey: workspaceKeys.all })
    },
  })
}

export function useUpdateWorkspaceRelationship(userId: string, workspaceId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      memberUserId,
      sponsorUserId,
    }: {
      memberUserId: string
      sponsorUserId: string
    }) => updateWorkspaceRelationship({ workspaceId, memberUserId, sponsorUserId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workspaceKeys.context(userId) })
      qc.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) })
      qc.invalidateQueries({ queryKey: workspaceKeys.pendingMembers(workspaceId) })
      qc.invalidateQueries({ queryKey: workspaceKeys.all })
    },
  })
}
