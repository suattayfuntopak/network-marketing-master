import { toCalendarKey, fromCalendarKey, istanbulDayStartIso } from '@/lib/utils/calendarDates'
import type { AdminClient } from '@/lib/supabase/admin'

export type PulseDailyMetrics = {
  training_reads: number
  objection_reads: number
  presentations_sent: number
  appointments_set: number
  appointments_done: number
  calls: number
  whatsapps: number
  new_candidates: number
  video_completions: number
}

export const EMPTY_PULSE_DAILY_METRICS: PulseDailyMetrics = {
  training_reads: 0,
  objection_reads: 0,
  presentations_sent: 0,
  appointments_set: 0,
  appointments_done: 0,
  calls: 0,
  whatsapps: 0,
  new_candidates: 0,
  video_completions: 0,
}

export function dayRangeIso(dayKey: string): { start: string; end: string } {
  const start = istanbulDayStartIso(dayKey)
  const next = fromCalendarKey(dayKey)
  next.setDate(next.getDate() + 1)
  const end = istanbulDayStartIso(toCalendarKey(next))
  return { start, end }
}

export function previousWeekStartKey(todayKey: string): string {
  const d = fromCalendarKey(todayKey)
  const dow = d.getDay()
  const daysToThisMonday = dow === 0 ? 6 : dow - 1
  d.setDate(d.getDate() - daysToThisMonday - 7)
  return toCalendarKey(d)
}

export function weekDayKeys(weekStartKey: string): string[] {
  const keys: string[] = []
  const start = fromCalendarKey(weekStartKey)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    keys.push(toCalendarKey(d))
  }
  return keys
}

export function sumDailyMetrics(rows: PulseDailyMetrics[]): PulseDailyMetrics {
  return rows.reduce(
    (acc, row) => ({
      training_reads: acc.training_reads + row.training_reads,
      objection_reads: acc.objection_reads + row.objection_reads,
      presentations_sent: acc.presentations_sent + row.presentations_sent,
      appointments_set: acc.appointments_set + row.appointments_set,
      appointments_done: acc.appointments_done + row.appointments_done,
      calls: acc.calls + row.calls,
      whatsapps: acc.whatsapps + row.whatsapps,
      new_candidates: acc.new_candidates + row.new_candidates,
      video_completions: acc.video_completions + row.video_completions,
    }),
    { ...EMPTY_PULSE_DAILY_METRICS }
  )
}

export function parseDailyMetrics(raw: unknown): PulseDailyMetrics {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PULSE_DAILY_METRICS }
  const m = raw as Record<string, unknown>
  const num = (k: keyof PulseDailyMetrics) =>
    typeof m[k] === 'number' ? (m[k] as number) : 0
  return {
    training_reads: num('training_reads'),
    objection_reads: num('objection_reads'),
    presentations_sent: num('presentations_sent'),
    appointments_set: num('appointments_set'),
    appointments_done: num('appointments_done'),
    calls: num('calls'),
    whatsapps: num('whatsapps'),
    new_candidates: num('new_candidates'),
    video_completions: num('video_completions'),
  }
}

export async function computePulseDailyMetrics(
  supabase: AdminClient,
  workspaceId: string,
  userId: string,
  dayKey: string
): Promise<PulseDailyMetrics> {
  const { start, end } = dayRangeIso(dayKey)

  const { data: events } = await supabase
    .from('nmm_learning_events')
    .select('event_type, item_key')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .gte('created_at', start)
    .lt('created_at', end)

  const trainingKeys = new Set<string>()
  const objectionKeys = new Set<string>()
  let presentations_sent = 0
  let appointments_set = 0
  let appointments_done = 0

  for (const e of events ?? []) {
    if (e.event_type === 'training_read' && e.item_key) trainingKeys.add(e.item_key)
    if (e.event_type === 'objection_read' && e.item_key) objectionKeys.add(e.item_key)
    if (e.event_type === 'presentation_sent') presentations_sent++
    if (e.event_type === 'appointment_set') appointments_set++
    if (e.event_type === 'appointment_done') appointments_done++
  }

  const { data: actions } = await supabase
    .from('nmm_daily_actions')
    .select('action_type')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .gte('created_at', start)
    .lt('created_at', end)

  const calls = actions?.filter(a => a.action_type === 'call').length ?? 0
  const whatsapps = actions?.filter(a => a.action_type === 'whatsapp').length ?? 0

  const { count: new_candidates } = await supabase
    .from('nmm_candidates')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('owner_id', userId)
    .gte('created_at', start)
    .lt('created_at', end)

  const { count: video_completions } = await supabase
    .from('nmm_video_progress')
    .select('video_key', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', start)
    .lt('completed_at', end)

  return {
    training_reads: trainingKeys.size,
    objection_reads: objectionKeys.size,
    presentations_sent,
    appointments_set,
    appointments_done,
    calls,
    whatsapps,
    new_candidates: new_candidates ?? 0,
    video_completions: video_completions ?? 0,
  }
}

export async function upsertPulseDailyRollup(
  supabase: AdminClient,
  workspaceId: string,
  userId: string,
  dayKey: string
): Promise<PulseDailyMetrics> {
  const metrics = await computePulseDailyMetrics(supabase, workspaceId, userId, dayKey)
  await supabase.from('nmm_team_pulse_daily').upsert(
    {
      user_id: userId,
      workspace_id: workspaceId,
      day: dayKey,
      metrics,
    },
    { onConflict: 'user_id,day' }
  )
  return metrics
}
