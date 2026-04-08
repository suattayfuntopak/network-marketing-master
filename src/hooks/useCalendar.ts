import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  fetchAppointments,
  fetchAppointment,
  fetchAppointmentsByContact,
  fetchTodayAppointments,
  fetchFollowUps,
  fetchFollowUpsByContact,
  fetchFollowUpBuckets,
  fetchTodayFollowUpsCount,
  fetchOverdueFollowUpsCount,
  categorizeFollowUps,
} from '@/lib/calendar/queries'
import {
  createAppointment,
  updateAppointment,
  deleteAppointment,
  completeAppointment,
  cancelAppointment,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  completeFollowUp,
  uncompleteFollowUp as uncompleteFollowUpRequest,
  snoozeFollowUp,
} from '@/lib/calendar/mutations'
import type {
  AppointmentInsert,
  AppointmentUpdate,
  FollowUpBuckets,
  FollowUpInsert,
  FollowUpStatus,
  FollowUpUpdate,
  FollowUpWithContact,
} from '@/lib/calendar/types'

export const calendarKeys = {
  all: ['calendar'] as const,
  appointments: (userId: string) => [...calendarKeys.all, 'appointments', userId] as const,
  appointmentsRange: (userId: string, from?: string, to?: string) => [...calendarKeys.appointments(userId), from, to] as const,
  appointment: (id: string) => [...calendarKeys.all, 'appointment', id] as const,
  contactAppointments: (contactId: string) => [...calendarKeys.all, 'contactAppointments', contactId] as const,
  todayAppointments: (userId: string) => [...calendarKeys.all, 'todayAppointments', userId] as const,
  followUps: (userId: string) => [...calendarKeys.all, 'followUps', userId] as const,
  followUpBuckets: (userId: string) => [...calendarKeys.all, 'followUpBuckets', userId] as const,
  contactFollowUps: (contactId: string) => [...calendarKeys.all, 'contactFollowUps', contactId] as const,
  todayFollowUpsCount: (userId: string) => [...calendarKeys.all, 'todayFollowUpsCount', userId] as const,
  overdueCount: (userId: string) => [...calendarKeys.all, 'overdueCount', userId] as const,
}

function syncFollowUpDerivedCaches(qc: ReturnType<typeof useQueryClient>, userId: string, buckets: FollowUpBuckets) {
  qc.setQueryData(calendarKeys.followUpBuckets(userId), buckets)
  qc.setQueryData(calendarKeys.todayFollowUpsCount(userId), buckets.today.length)
  qc.setQueryData(calendarKeys.overdueCount(userId), buckets.overdue.length)
}

function patchFollowUpCaches(
  qc: ReturnType<typeof useQueryClient>,
  userId: string,
  updater: (followUp: FollowUpWithContact) => FollowUpWithContact | null
) {
  const listSnapshots = qc.getQueriesData<FollowUpWithContact[]>({ queryKey: calendarKeys.followUps(userId) })
  const contactSnapshots = qc.getQueriesData<FollowUpWithContact[]>({
    queryKey: [...calendarKeys.all, 'contactFollowUps'],
  })
  const bucketsSnapshot = qc.getQueryData<FollowUpBuckets>(calendarKeys.followUpBuckets(userId))
  const todayCountSnapshot = qc.getQueryData<number>(calendarKeys.todayFollowUpsCount(userId))
  const overdueCountSnapshot = qc.getQueryData<number>(calendarKeys.overdueCount(userId))

  listSnapshots.forEach(([key, value]) => {
    if (!value) return
    qc.setQueryData(
      key,
      value
        .map((item) => updater(item))
        .filter((item): item is FollowUpWithContact => item !== null)
    )
  })

  contactSnapshots.forEach(([key, value]) => {
    if (!value) return
    qc.setQueryData(
      key,
      value
        .map((item) => updater(item))
        .filter((item): item is FollowUpWithContact => item !== null)
    )
  })

  if (bucketsSnapshot) {
    const nextAll = bucketsSnapshot.all
      .map((item) => updater(item))
      .filter((item): item is FollowUpWithContact => item !== null)
    syncFollowUpDerivedCaches(qc, userId, categorizeFollowUps(nextAll))
  }

  return {
    listSnapshots,
    contactSnapshots,
    bucketsSnapshot,
    todayCountSnapshot,
    overdueCountSnapshot,
  }
}

function restoreFollowUpSnapshots(
  qc: ReturnType<typeof useQueryClient>,
  userId: string,
  snapshot: ReturnType<typeof patchFollowUpCaches>
) {
  snapshot.listSnapshots.forEach(([key, value]) => {
    qc.setQueryData(key, value)
  })
  snapshot.contactSnapshots.forEach(([key, value]) => {
    qc.setQueryData(key, value)
  })
  if (snapshot.bucketsSnapshot) {
    qc.setQueryData(calendarKeys.followUpBuckets(userId), snapshot.bucketsSnapshot)
  }
  if (typeof snapshot.todayCountSnapshot !== 'undefined') {
    qc.setQueryData(calendarKeys.todayFollowUpsCount(userId), snapshot.todayCountSnapshot)
  }
  if (typeof snapshot.overdueCountSnapshot !== 'undefined') {
    qc.setQueryData(calendarKeys.overdueCount(userId), snapshot.overdueCountSnapshot)
  }
}

function invalidateFollowUpQueries(qc: ReturnType<typeof useQueryClient>, userId: string) {
  qc.invalidateQueries({ queryKey: calendarKeys.followUps(userId) })
  qc.invalidateQueries({ queryKey: calendarKeys.followUpBuckets(userId) })
  qc.invalidateQueries({ queryKey: calendarKeys.todayFollowUpsCount(userId) })
  qc.invalidateQueries({ queryKey: calendarKeys.overdueCount(userId) })
}

export function useAppointments(userId: string, from?: Date, to?: Date) {
  return useQuery({
    queryKey: calendarKeys.appointmentsRange(userId, from?.toISOString(), to?.toISOString()),
    queryFn: () => fetchAppointments(userId, from, to),
    enabled: !!userId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: calendarKeys.appointment(id),
    queryFn: () => fetchAppointment(id),
    enabled: !!id,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useContactAppointments(contactId: string, userId: string) {
  return useQuery({
    queryKey: calendarKeys.contactAppointments(contactId),
    queryFn: () => fetchAppointmentsByContact(contactId, userId),
    enabled: !!contactId && !!userId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useTodayAppointments(userId: string) {
  return useQuery({
    queryKey: calendarKeys.todayAppointments(userId),
    queryFn: () => fetchTodayAppointments(userId),
    enabled: !!userId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useFollowUps(userId: string, status?: FollowUpStatus | FollowUpStatus[]) {
  return useQuery({
    queryKey: [...calendarKeys.followUps(userId), status],
    queryFn: () => fetchFollowUps(userId, status),
    enabled: !!userId,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useFollowUpBuckets(userId: string) {
  return useQuery({
    queryKey: calendarKeys.followUpBuckets(userId),
    queryFn: () => fetchFollowUpBuckets(userId),
    enabled: !!userId,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useContactFollowUps(contactId: string, userId: string) {
  return useQuery({
    queryKey: calendarKeys.contactFollowUps(contactId),
    queryFn: () => fetchFollowUpsByContact(contactId, userId),
    enabled: !!contactId && !!userId,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useTodayFollowUpsCount(userId: string) {
  return useQuery({
    queryKey: calendarKeys.todayFollowUpsCount(userId),
    queryFn: () => fetchTodayFollowUpsCount(userId),
    enabled: !!userId,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useOverdueFollowUpsCount(userId: string) {
  return useQuery({
    queryKey: calendarKeys.overdueCount(userId),
    queryFn: () => fetchOverdueFollowUpsCount(userId),
    enabled: !!userId,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useCreateAppointment(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: AppointmentInsert) => createAppointment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.appointments(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.todayAppointments(userId) })
      toast.success(t('calendar.appointment.created'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useUpdateAppointment(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentUpdate }) => updateAppointment(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: calendarKeys.appointments(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.appointment(id) })
      qc.invalidateQueries({ queryKey: calendarKeys.todayAppointments(userId) })
      toast.success(t('calendar.appointment.updated'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useDeleteAppointment(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteAppointment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.appointments(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.todayAppointments(userId) })
      toast.success(t('calendar.appointment.deleted'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useCompleteAppointment(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => completeAppointment(id, notes),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: calendarKeys.appointments(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.appointment(id) })
      toast.success(t('calendar.appointment.completed'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useCancelAppointment(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => cancelAppointment(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: calendarKeys.appointments(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.appointment(id) })
      toast.success(t('calendar.appointment.cancelled'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useCreateFollowUp(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: FollowUpInsert) => createFollowUp(data),
    onSuccess: () => {
      invalidateFollowUpQueries(qc, userId)
      toast.success(t('followUps.created'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useUpdateFollowUp(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FollowUpUpdate }) => updateFollowUp(id, data),
    onSuccess: () => {
      invalidateFollowUpQueries(qc, userId)
      toast.success(t('followUps.updated'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useDeleteFollowUp(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteFollowUp(id),
    onSuccess: () => {
      invalidateFollowUpQueries(qc, userId)
      toast.success(t('followUps.deleted'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useCompleteFollowUp(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => completeFollowUp(id),
    onMutate: async (id) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: calendarKeys.followUps(userId) }),
        qc.cancelQueries({ queryKey: calendarKeys.followUpBuckets(userId) }),
        qc.cancelQueries({ queryKey: [...calendarKeys.all, 'contactFollowUps'] }),
      ])

      const completedAt = new Date().toISOString()
      const snapshot = patchFollowUpCaches(qc, userId, (followUp) => {
        if (followUp.id !== id) return followUp
        return {
          ...followUp,
          status: 'completed',
          completed_at: completedAt,
        }
      })

      return { id, snapshot }
    },
    onError: (_error, _id, context) => {
      if (context) {
        restoreFollowUpSnapshots(qc, userId, context.snapshot)
      }
      toast.error(t('common.unknownError'))
    },
    onSuccess: async (_data, id) => {
      toast.success(t('followUps.actions.complete'), {
        action: {
          label: t('followUps.undoAction'),
          onClick: async () => {
            try {
              await uncompleteFollowUpRequest(id)
              invalidateFollowUpQueries(qc, userId)
              toast.success(t('followUps.uncompleted'))
            } catch {
              toast.error(t('common.unknownError'))
            }
          },
        },
      })
    },
    onSettled: () => {
      invalidateFollowUpQueries(qc, userId)
    },
  })
}

export function useUncompleteFollowUp(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: string) => uncompleteFollowUpRequest(id),
    onMutate: async (id) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: calendarKeys.followUps(userId) }),
        qc.cancelQueries({ queryKey: calendarKeys.followUpBuckets(userId) }),
        qc.cancelQueries({ queryKey: [...calendarKeys.all, 'contactFollowUps'] }),
      ])

      const snapshot = patchFollowUpCaches(qc, userId, (followUp) => {
        if (followUp.id !== id) return followUp
        return {
          ...followUp,
          status: 'pending',
          completed_at: null,
        }
      })

      return { snapshot }
    },
    onError: (_error, _id, context) => {
      if (context) {
        restoreFollowUpSnapshots(qc, userId, context.snapshot)
      }
      toast.error(t('common.unknownError'))
    },
    onSuccess: () => {
      toast.success(t('followUps.uncompleted'))
    },
    onSettled: () => {
      invalidateFollowUpQueries(qc, userId)
    },
  })
}

export function useSnoozeFollowUp(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, until }: { id: string; until: Date }) => snoozeFollowUp(id, until),
    onSuccess: () => {
      invalidateFollowUpQueries(qc, userId)
      toast.success(t('followUps.snoozed'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}
