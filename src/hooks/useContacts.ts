import { useQuery } from '@tanstack/react-query'
import {
  fetchContacts,
  fetchContactCount,
  fetchContactsCreatedThisWeekCount,
  fetchContactsWithBirthdayToday,
  fetchRecentContacts,
  fetchPendingFollowUps,
  fetchContactStageCounts,
} from '@/lib/contacts/queries'
import type { ContactListParams } from '@/lib/contacts/types'

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params: ContactListParams) => [...contactKeys.lists(), params.userId, params.filters, params.sort, params.page, params.pageSize] as const,
  count: (userId: string) => [...contactKeys.all, 'count', userId] as const,
  createdThisWeek: (userId: string) => [...contactKeys.all, 'createdThisWeek', userId] as const,
  birthdaysToday: (userId: string) => [...contactKeys.all, 'birthdaysToday', userId] as const,
  stageCounts: (userId: string) => [...contactKeys.all, 'stageCounts', userId] as const,
  recent: (userId: string) => [...contactKeys.all, 'recent', userId] as const,
  pending: (userId: string) => [...contactKeys.all, 'pending', userId] as const,
}

export function useContacts(params: ContactListParams) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => fetchContacts(params),
    enabled: !!params.userId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useContactCount(userId: string) {
  return useQuery({
    queryKey: contactKeys.count(userId),
    queryFn: () => fetchContactCount(userId),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useContactsCreatedThisWeekCount(userId: string) {
  return useQuery({
    queryKey: contactKeys.createdThisWeek(userId),
    queryFn: () => fetchContactsCreatedThisWeekCount(userId),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useContactsWithBirthdayToday(userId: string) {
  return useQuery({
    queryKey: contactKeys.birthdaysToday(userId),
    queryFn: () => fetchContactsWithBirthdayToday(userId),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function useRecentContacts(userId: string) {
  return useQuery({
    queryKey: contactKeys.recent(userId),
    queryFn: () => fetchRecentContacts(userId),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}

export function usePendingFollowUps(userId: string) {
  return useQuery({
    queryKey: contactKeys.pending(userId),
    queryFn: () => fetchPendingFollowUps(userId),
    enabled: !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

export function useContactStageCounts(userId: string) {
  return useQuery({
    queryKey: contactKeys.stageCounts(userId),
    queryFn: () => fetchContactStageCounts(userId),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
