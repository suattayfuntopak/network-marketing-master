'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotificationPreferencesAction,
  updateNotificationPreferencesAction,
  type NotificationPreferences,
} from '@/app/(dashboard)/actions/notificationPreferences'
import {
  readNotificationPrefsFromStorage,
  writeNotificationPrefsToStorage,
} from '@/lib/ui/notificationPrefsStorage'
import { queryKeys } from '@/lib/query/keys'

const DEFAULT_PREFS: NotificationPreferences = {
  email: true,
  push: true,
  sound: true,
}

export function useNotificationPreferences() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.notificationPreferences(),
    queryFn: async () => {
      const fromServer = await getNotificationPreferencesAction()
      if (fromServer) {
        writeNotificationPrefsToStorage(fromServer)
        return fromServer
      }
      return readNotificationPrefsFromStorage()
    },
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: () =>
      typeof window !== 'undefined' ? readNotificationPrefsFromStorage() : DEFAULT_PREFS,
  })

  const mutation = useMutation({
    mutationFn: async (next: NotificationPreferences) => {
      const result = await updateNotificationPreferencesAction(next)
      if (!result.ok) throw new Error(result.error)
      return next
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notificationPreferences() })
      const previous = queryClient.getQueryData<NotificationPreferences>(
        queryKeys.notificationPreferences(),
      )
      queryClient.setQueryData(queryKeys.notificationPreferences(), next)
      writeNotificationPrefsToStorage(next)
      return { previous }
    },
    onError: (_err, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notificationPreferences(), context.previous)
        writeNotificationPrefsToStorage(context.previous)
      }
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.notificationPreferences(), next)
      writeNotificationPrefsToStorage(next)
    },
  })

  const prefs = query.data ?? DEFAULT_PREFS

  async function savePrefs(next: NotificationPreferences) {
    return mutation.mutateAsync(next)
  }

  return {
    prefs,
    isLoading: query.isLoading && !query.isFetched,
    isSaving: mutation.isPending,
    savePrefs,
  }
}
