'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchUserSettingsAction,
  patchUserSettingsAction,
} from '@/app/(dashboard)/actions/userSettings'
import {
  DEFAULT_USER_SETTINGS,
  type UserSettings,
} from '@/lib/domain/userSettings'
import {
  clearLegacyUserSettingsGlobals,
  mergeWithDefaults,
  readLegacyUserSettingsGlobals,
  readUserSettingsCache,
  writeUserSettingsCache,
} from '@/lib/ui/userSettingsStorage'
import { queryKeys } from '@/lib/query/keys'

function needsLegacyMigration(server: UserSettings, legacy: Partial<UserSettings>): boolean {
  if (legacy.onboardingDone && !server.onboardingDone) return true
  const legacyKeys = Object.keys(legacy.complianceChecklist ?? {})
  const serverKeys = Object.keys(server.complianceChecklist)
  return legacyKeys.length > 0 && serverKeys.length === 0
}

export function useUserSettings(userId: string | undefined | null) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.userSettings(userId ?? ''),
    queryFn: async (): Promise<UserSettings> => {
      if (!userId) return DEFAULT_USER_SETTINGS

      let fromServer = await fetchUserSettingsAction()
      const legacy = readLegacyUserSettingsGlobals()

      if (needsLegacyMigration(fromServer, legacy)) {
        fromServer = mergeWithDefaults({
          onboardingDone: fromServer.onboardingDone || legacy.onboardingDone === true,
          complianceChecklist: {
            ...fromServer.complianceChecklist,
            ...(legacy.complianceChecklist ?? {}),
          },
        })
        fromServer = await patchUserSettingsAction(fromServer)
        clearLegacyUserSettingsGlobals()
      }

      writeUserSettingsCache(userId, fromServer)
      return fromServer
    },
    enabled: !!userId,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData: () => {
      if (!userId || typeof window === 'undefined') return DEFAULT_USER_SETTINGS
      return readUserSettingsCache(userId) ?? DEFAULT_USER_SETTINGS
    },
  })

  const mutation = useMutation({
    mutationFn: async (patch: Partial<UserSettings>) => {
      if (!userId) throw new Error('Oturum yok.')
      return patchUserSettingsAction(patch)
    },
    onMutate: async (patch) => {
      if (!userId) return { previous: DEFAULT_USER_SETTINGS }
      await queryClient.cancelQueries({ queryKey: queryKeys.userSettings(userId) })
      const previous =
        queryClient.getQueryData<UserSettings>(queryKeys.userSettings(userId)) ??
        DEFAULT_USER_SETTINGS
      const next: UserSettings = {
        onboardingDone: patch.onboardingDone ?? previous.onboardingDone,
        complianceChecklist: patch.complianceChecklist ?? previous.complianceChecklist,
      }
      queryClient.setQueryData(queryKeys.userSettings(userId), next)
      writeUserSettingsCache(userId, next)
      return { previous }
    },
    onError: (_err, _patch, context) => {
      if (!userId || !context?.previous) return
      queryClient.setQueryData(queryKeys.userSettings(userId), context.previous)
      writeUserSettingsCache(userId, context.previous)
    },
    onSuccess: (next) => {
      if (!userId) return
      queryClient.setQueryData(queryKeys.userSettings(userId), next)
      writeUserSettingsCache(userId, next)
    },
  })

  const settings = query.data ?? DEFAULT_USER_SETTINGS

  async function patchSettings(patch: Partial<UserSettings>) {
    return mutation.mutateAsync(patch)
  }

  return {
    settings,
    isLoading: !!userId && query.isLoading && !query.isFetched,
    isSaving: mutation.isPending,
    patchSettings,
  }
}
