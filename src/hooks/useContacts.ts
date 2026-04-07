import { useQuery } from '@tanstack/react-query'
import { fetchContacts, fetchContactCount, fetchRecentContacts, fetchPendingFollowUps, fetchContactStageCounts } from '@/lib/contacts/queries'
import type { ContactListParams } from '@/lib/contacts/types'

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params: ContactListParams) => [...contactKeys.lists(), params.userId, params.filters, params.sort, params.page, params.pageSize] as const,
  count: (userId: string) => [...contactKeys.all, 'count', userId] as const,
  stageCounts: (userId: string) => [...contactKeys.all, 'stageCounts', userId] as const,
  recent: (userId: string) => [...contactKeys.all, 'recent', userId] as const,
  pending: (userId: string) => [...contactKeys.all, 'pending', userId] as const,
}

export function useContacts(params: ContactListParams) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: async () => {
      console.debug('[useContacts] Fetching with filters:', JSON.stringify(params.filters))
      const result = await fetchContacts(params)
      console.debug('[useContacts] Result count:', result.count, 'data:', result.data.length)
      return result
    },
    enabled: !!params.userId,
    staleTime: 0,
  })
}

export function useContactCount(userId: string) {
  return useQuery({
    queryKey: contactKeys.count(userId),
    queryFn: () => fetchContactCount(userId),
    enabled: !!userId,
  })
}

export function useRecentContacts(userId: string) {
  return useQuery({
    queryKey: contactKeys.recent(userId),
    queryFn: () => fetchRecentContacts(userId),
    enabled: !!userId,
  })
}

export function usePendingFollowUps(userId: string) {
  return useQuery({
    queryKey: contactKeys.pending(userId),
    queryFn: () => fetchPendingFollowUps(userId),
    enabled: !!userId,
  })
}

export function useContactStageCounts(userId: string) {
  return useQuery({
    queryKey: contactKeys.stageCounts(userId),
    queryFn: () => fetchContactStageCounts(userId),
    enabled: !!userId,
    staleTime: 60_000,
  })
}
