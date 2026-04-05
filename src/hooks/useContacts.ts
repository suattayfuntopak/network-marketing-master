import { useQuery } from '@tanstack/react-query'
import { fetchContacts, fetchContactCount, fetchRecentContacts, fetchPendingFollowUps } from '@/lib/contacts/queries'
import type { ContactListParams } from '@/lib/contacts/types'

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params: Omit<ContactListParams, 'userId'>) => [...contactKeys.lists(), params] as const,
  count: (userId: string) => [...contactKeys.all, 'count', userId] as const,
  recent: (userId: string) => [...contactKeys.all, 'recent', userId] as const,
  pending: (userId: string) => [...contactKeys.all, 'pending', userId] as const,
}

export function useContacts(params: ContactListParams) {
  return useQuery({
    queryKey: contactKeys.list({ filters: params.filters, sort: params.sort, page: params.page, pageSize: params.pageSize }),
    queryFn: () => fetchContacts(params),
    enabled: !!params.userId,
    placeholderData: (prev) => prev,
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
