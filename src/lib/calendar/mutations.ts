import { supabase } from '@/lib/supabase'
import type { AppointmentInsert, AppointmentUpdate, FollowUpInsert, FollowUpUpdate } from './types'

// ─── Appointments ─────────────────────────────────────────────

export async function createAppointment(data: AppointmentInsert): Promise<string> {
  const { data: result, error } = await supabase
    .from('nmm_appointments')
    .insert(data)
    .select('id')
    .single()

  if (error) throw error
  return result.id
}

export async function updateAppointment(id: string, data: AppointmentUpdate): Promise<void> {
  const { error } = await supabase
    .from('nmm_appointments')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from('nmm_appointments').delete().eq('id', id)
  if (error) throw error
}

export async function completeAppointment(id: string, outcomeNotes?: string): Promise<void> {
  await updateAppointment(id, {
    status: 'completed',
    outcome_notes: outcomeNotes ?? null,
  })
}

export async function cancelAppointment(id: string): Promise<void> {
  await updateAppointment(id, { status: 'cancelled' })
}

// ─── Follow-ups ───────────────────────────────────────────────

export async function createFollowUp(data: FollowUpInsert): Promise<string> {
  const { data: result, error } = await supabase
    .from('nmm_follow_ups')
    .insert(data)
    .select('id')
    .single()

  if (error) throw error
  return result.id
}

export async function updateFollowUp(id: string, data: FollowUpUpdate): Promise<void> {
  const { error } = await supabase
    .from('nmm_follow_ups')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteFollowUp(id: string): Promise<void> {
  const { error } = await supabase.from('nmm_follow_ups').delete().eq('id', id)
  if (error) throw error
}

export async function completeFollowUp(id: string): Promise<void> {
  await updateFollowUp(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  })
}

export async function uncompleteFollowUp(id: string): Promise<void> {
  await updateFollowUp(id, {
    status: 'pending',
    completed_at: null,
  })
}

export async function snoozeFollowUp(id: string, until: Date): Promise<void> {
  await updateFollowUp(id, {
    status: 'snoozed',
    snoozed_until: until.toISOString(),
    due_at: until.toISOString(),
  })
}
