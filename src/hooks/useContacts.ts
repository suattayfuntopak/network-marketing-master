import { useQuery } from '@tanstack/react-query'
import {
  fetchContacts,
  fetchContactCount,
  fetchContactInsights,
  fetchMessageContacts,
  fetchProcessContacts,
  fetchContactSummaryCounts,
  fetchContactSummaryRows,
  fetchContactsCreatedThisWeekCount,
  fetchContactsWithBirthdayToday,
  fetchRecentContacts,
  fetchPendingFollowUps,
  fetchContactStageCounts,
} from '@/lib/contacts/queries'
import type { ContactListParams } from '@/lib/contacts/types'
import type { ContactInsightQueryParams, MessageContactQueryParams, ProcessContactQueryParams } from '@/lib/contacts/types'
import type { Contact } from '@/types/database'
import type { ContactSummaryKey } from '@/lib/contacts/queries'

export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (params: ContactListParams) => [...contactKeys.lists(), params.userId, params.filters, params.sort, params.page, params.pageSize] as const,
  insights: (params: ContactInsightQueryParams) => [...contactKeys.all, 'insights', params] as const,
  messageContacts: (params: MessageContactQueryParams) => [...contactKeys.all, 'messageContacts', params] as const,
  processContacts: (params: ProcessContactQueryParams) => [...contactKeys.all, 'processContacts', params] as const,
  count: (userId: string) => [...contactKeys.all, 'count', userId] as const,
  summaryCounts: (userId: string, contactTypes: Contact['contact_type'][]) =>
    [...contactKeys.all, 'summaryCounts', userId, contactTypes] as const,
  summaryRows: (userId: string, summaryKey: ContactSummaryKey, contactTypes: Contact['contact_type'][]) =>
    [...contactKeys.all, 'summaryRows', userId, summaryKey, contactTypes] as const,
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
    staleTime: 10_000,
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: 2,
  })
}

export function useContactInsights(params: ContactInsightQueryParams) {
  return useQuery({
    queryKey: contactKeys.insights(params),
    queryFn: () => fetchContactInsights(params),
    enabled: !!params.userId,
    staleTime: 20_000,
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useMessageContacts(params: MessageContactQueryParams) {
  return useQuery({
    queryKey: contactKeys.messageContacts(params),
    queryFn: () => fetchMessageContacts(params),
    enabled: !!params.userId,
    staleTime: 20_000,
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useProcessContacts(params: ProcessContactQueryParams) {
  return useQuery({
    queryKey: contactKeys.processContacts(params),
    queryFn: () => fetchProcessContacts(params),
    enabled: !!params.userId,
    staleTime: 20_000,
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useContactCount(userId: string) {
  return useQuery({
    queryKey: contactKeys.count(userId),
    queryFn: () => fetchContactCount(userId),
    enabled: !!userId,
    staleTime: 10_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useContactSummaryCounts(
  userId: string,
  contactTypes: Contact['contact_type'][] = []
) {
  return useQuery({
    queryKey: contactKeys.summaryCounts(userId, contactTypes),
    queryFn: () => fetchContactSummaryCounts(userId, contactTypes),
    enabled: !!userId,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useContactSummaryRows(
  userId: string,
  summaryKey: ContactSummaryKey,
  contactTypes: Contact['contact_type'][] = []
) {
  return useQuery({
    queryKey: contactKeys.summaryRows(userId, summaryKey, contactTypes),
    queryFn: () => fetchContactSummaryRows(userId, summaryKey, contactTypes),
    enabled: !!userId,
    staleTime: 10_000,
    placeholderData: (previousData) => previousData,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useContactsCreatedThisWeekCount(userId: string) {
  return useQuery({
    queryKey: contactKeys.createdThisWeek(userId),
    queryFn: () => fetchContactsCreatedThisWeekCount(userId),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useContactsWithBirthdayToday(userId: string) {
  return useQuery({
    queryKey: contactKeys.birthdaysToday(userId),
    queryFn: () => fetchContactsWithBirthdayToday(userId),
    enabled: !!userId,
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useRecentContacts(userId: string) {
  return useQuery({
    queryKey: contactKeys.recent(userId),
    queryFn: () => fetchRecentContacts(userId),
    enabled: !!userId,
    staleTime: 10_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function usePendingFollowUps(userId: string) {
  return useQuery({
    queryKey: contactKeys.pending(userId),
    queryFn: () => fetchPendingFollowUps(userId),
    enabled: !!userId,
    staleTime: 10_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}

export function useContactStageCounts(userId: string) {
  return useQuery({
    queryKey: contactKeys.stageCounts(userId),
    queryFn: () => fetchContactStageCounts(userId),
    enabled: !!userId,
    staleTime: 10_000,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  })
}
