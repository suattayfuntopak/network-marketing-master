'use server'

import { createClient } from '@/lib/supabase/server'
import {
  computeFieldStreak,
  periodStartIso,
  type FieldEngagementSummary,
} from '@/lib/domain/pulse'

export type MyPanoInsights = {
  fieldWeek: FieldEngagementSummary
  fieldStreak: number
}

export async function getMyPanoInsightsAction(workspaceId: string): Promise<MyPanoInsights> {
  const emptyField: FieldEngagementSummary = {
    newCandidates: 0,
    calls: 0,
    whatsapps: 0,
    presentationsSent: 0,
    appointmentsSet: 0,
    appointmentsDone: 0,
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { fieldWeek: emptyField, fieldStreak: 0 }

  const weekStart = periodStartIso('7d')!
  const streakStart = new Date()
  streakStart.setDate(streakStart.getDate() - 90)
  streakStart.setHours(0, 0, 0, 0)

  const [{ data: weekActions }, { data: streakActions }, { data: newCandidates }] = await Promise.all([
    supabase
      .from('nmm_daily_actions')
      .select('action_type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', weekStart),
    supabase
      .from('nmm_daily_actions')
      .select('action_type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', streakStart.toISOString()),
    supabase
      .from('nmm_candidates')
      .select('id')
      .eq('owner_id', user.id)
      .eq('workspace_id', workspaceId)
      .gte('created_at', weekStart),
  ])

  const fieldWeek: FieldEngagementSummary = { ...emptyField }
  fieldWeek.newCandidates = newCandidates?.length ?? 0

  for (const act of weekActions ?? []) {
    if (act.action_type === 'call') fieldWeek.calls++
    else if (act.action_type === 'whatsapp') fieldWeek.whatsapps++
    else if (act.action_type === 'stage_change') fieldWeek.presentationsSent++
  }

  const fieldStreak = computeFieldStreak(streakActions ?? [])

  return { fieldWeek, fieldStreak }
}
