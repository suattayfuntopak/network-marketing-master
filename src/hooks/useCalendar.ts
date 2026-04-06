import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  fetchAppointments, fetchAppointment, fetchAppointmentsByContact,
  fetchTodayAppointments, fetchFollowUps, fetchFollowUpsByContact,
  fetchFollowUpBuckets, fetchTodayFollowUpsCount, fetchOverdueFollowUpsCount,
} from '@/lib/calendar/queries'
import {
  createAppointment, updateAppointment, deleteAppointment,
  completeAppointment, cancelAppointment,
  createFollowUp, updateFollowUp, deleteFollowUp,
  completeFollowUp, snoozeFollowUp,
} from '@/lib/calendar/mutations'
import type { AppointmentInsert, AppointmentUpdate, FollowUpInsert, FollowUpUpdate, FollowUpStatus } from '@/lib/calendar/types'

// ─── Query keys ───────────────────────────────────────────────

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

// ─── Appointment queries ──────────────────────────────────────

export function useAppointments(userId: string, from?: Date, to?: Date) {
  return useQuery({
    queryKey: calendarKeys.appointmentsRange(userId, from?.toISOString(), to?.toISOString()),
    queryFn: () => fetchAppointments(userId, from, to),
    enabled: !!userId,
  })
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: calendarKeys.appointment(id),
    queryFn: () => fetchAppointment(id),
    enabled: !!id,
  })
}

export function useContactAppointments(contactId: string, userId: string) {
  return useQuery({
    queryKey: calendarKeys.contactAppointments(contactId),
    queryFn: () => fetchAppointmentsByContact(contactId, userId),
    enabled: !!contactId && !!userId,
  })
}

export function useTodayAppointments(userId: string) {
  return useQuery({
    queryKey: calendarKeys.todayAppointments(userId),
    queryFn: () => fetchTodayAppointments(userId),
    enabled: !!userId,
  })
}

// ─── Follow-up queries ────────────────────────────────────────

export function useFollowUps(userId: string, status?: FollowUpStatus | FollowUpStatus[]) {
  return useQuery({
    queryKey: [...calendarKeys.followUps(userId), status],
    queryFn: () => fetchFollowUps(userId, status),
    enabled: !!userId,
  })
}

export function useFollowUpBuckets(userId: string) {
  return useQuery({
    queryKey: calendarKeys.followUpBuckets(userId),
    queryFn: () => fetchFollowUpBuckets(userId),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useContactFollowUps(contactId: string, userId: string) {
  return useQuery({
    queryKey: calendarKeys.contactFollowUps(contactId),
    queryFn: () => fetchFollowUpsByContact(contactId, userId),
    enabled: !!contactId && !!userId,
  })
}

export function useTodayFollowUpsCount(userId: string) {
  return useQuery({
    queryKey: calendarKeys.todayFollowUpsCount(userId),
    queryFn: () => fetchTodayFollowUpsCount(userId),
    enabled: !!userId,
    staleTime: 60_000,
  })
}

export function useOverdueFollowUpsCount(userId: string) {
  return useQuery({
    queryKey: calendarKeys.overdueCount(userId),
    queryFn: () => fetchOverdueFollowUpsCount(userId),
    enabled: !!userId,
    staleTime: 60_000,
  })
}

// ─── Appointment mutations ────────────────────────────────────

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

// ─── Follow-up mutations ──────────────────────────────────────

export function useCreateFollowUp(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: FollowUpInsert) => createFollowUp(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.followUps(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.followUpBuckets(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.todayFollowUpsCount(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.overdueCount(userId) })
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
      qc.invalidateQueries({ queryKey: calendarKeys.followUps(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.followUpBuckets(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.todayFollowUpsCount(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.overdueCount(userId) })
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
      qc.invalidateQueries({ queryKey: calendarKeys.followUps(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.followUpBuckets(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.todayFollowUpsCount(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.overdueCount(userId) })
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.followUps(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.followUpBuckets(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.todayFollowUpsCount(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.overdueCount(userId) })
      toast.success(t('followUps.actions.complete') + ' ✓')
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useSnoozeFollowUp(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, until }: { id: string; until: Date }) => snoozeFollowUp(id, until),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.followUps(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.followUpBuckets(userId) })
      qc.invalidateQueries({ queryKey: calendarKeys.todayFollowUpsCount(userId) })
      toast.success(t('followUps.snoozed'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}
