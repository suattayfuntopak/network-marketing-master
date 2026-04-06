import { supabase } from '@/lib/supabase'
import { startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from 'date-fns'
import type { AppointmentWithContact, FollowUpWithContact, FollowUpStatus } from './types'

// ─── Appointments ─────────────────────────────────────────────

export async function fetchAppointments(userId: string, from?: Date, to?: Date): Promise<AppointmentWithContact[]> {
  let query = supabase
    .from('nmm_appointments')
    .select('*, contact:nmm_contacts(id, full_name, phone)')
    .eq('user_id', userId)
    .order('starts_at', { ascending: true })

  if (from) query = query.gte('starts_at', from.toISOString())
  if (to)   query = query.lte('starts_at', to.toISOString())

  const { data, error } = await query
  if (error) throw error
  return data as AppointmentWithContact[]
}

export async function fetchAppointment(id: string): Promise<AppointmentWithContact | null> {
  const { data, error } = await supabase
    .from('nmm_appointments')
    .select('*, contact:nmm_contacts(id, full_name, phone)')
    .eq('id', id)
    .single()

  if (error) { if (error.code === 'PGRST116') return null; throw error }
  return data as AppointmentWithContact
}

export async function fetchAppointmentsByContact(contactId: string, userId: string): Promise<AppointmentWithContact[]> {
  const { data, error } = await supabase
    .from('nmm_appointments')
    .select('*, contact:nmm_contacts(id, full_name, phone)')
    .eq('contact_id', contactId)
    .eq('user_id', userId)
    .order('starts_at', { ascending: false })

  if (error) throw error
  return data as AppointmentWithContact[]
}

export async function fetchTodayAppointments(userId: string): Promise<AppointmentWithContact[]> {
  const now = new Date()
  return fetchAppointments(userId, startOfDay(now), endOfDay(now))
}

// ─── Follow-ups ───────────────────────────────────────────────

export async function fetchFollowUps(userId: string, status?: FollowUpStatus | FollowUpStatus[]): Promise<FollowUpWithContact[]> {
  let query = supabase
    .from('nmm_follow_ups')
    .select('*, contact:nmm_contacts(id, full_name, phone)')
    .eq('user_id', userId)
    .order('due_at', { ascending: true })

  if (status) {
    if (Array.isArray(status)) query = query.in('status', status)
    else query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as FollowUpWithContact[]
}

export async function fetchFollowUpsByContact(contactId: string, userId: string): Promise<FollowUpWithContact[]> {
  const { data, error } = await supabase
    .from('nmm_follow_ups')
    .select('*, contact:nmm_contacts(id, full_name, phone)')
    .eq('contact_id', contactId)
    .eq('user_id', userId)
    .order('due_at', { ascending: true })

  if (error) throw error
  return data as FollowUpWithContact[]
}

// Bucketed fetch for follow-up tabs
export async function fetchFollowUpBuckets(userId: string) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd   = endOfDay(now)
  const tomorrowStart = startOfDay(addDays(now, 1))
  const tomorrowEnd   = endOfDay(addDays(now, 1))
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const { data: all, error } = await supabase
    .from('nmm_follow_ups')
    .select('*, contact:nmm_contacts(id, full_name, phone)')
    .eq('user_id', userId)
    .order('due_at', { ascending: true })

  if (error) throw error

  const items = all as FollowUpWithContact[]

  return {
    today:     items.filter(f => f.status === 'pending' && f.due_at >= todayStart.toISOString() && f.due_at <= todayEnd.toISOString()),
    tomorrow:  items.filter(f => f.status === 'pending' && f.due_at >= tomorrowStart.toISOString() && f.due_at <= tomorrowEnd.toISOString()),
    thisWeek:  items.filter(f => f.status === 'pending' && f.due_at > todayEnd.toISOString() && f.due_at <= weekEnd.toISOString()),
    overdue:   items.filter(f => f.status === 'pending' && f.due_at < todayStart.toISOString()),
    completed: items.filter(f => f.status === 'completed').slice(0, 50),
  }
}

export async function fetchTodayFollowUpsCount(userId: string): Promise<number> {
  const now = new Date()
  const { count, error } = await supabase
    .from('nmm_follow_ups')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('due_at', startOfDay(now).toISOString())
    .lte('due_at', endOfDay(now).toISOString())

  if (error) throw error
  return count ?? 0
}

export async function fetchOverdueFollowUpsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('nmm_follow_ups')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('due_at', startOfDay(new Date()).toISOString())

  if (error) throw error
  return count ?? 0
}
