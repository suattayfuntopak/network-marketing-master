import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cronAuthError } from '@/lib/infra/cronAuth'
import { buildCalendarByDate } from '@/lib/domain/calendarFollowUp'
import { todayCalendarKey } from '@/lib/utils/calendarDates'
import type { NmmCandidate } from '@/types/database.types'

export async function GET(request: NextRequest) {
  const authError = cronAuthError(request)
  if (authError) return authError

  const supabase = createAdminClient()
  const todayKey = todayCalendarKey()
  const results: { userId: string; candidateId: string; sent: boolean }[] = []

  const dayStart = new Date()
  dayStart.setHours(0, 0, 0, 0)

  const { data: workspaces, error } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id, license_type, license_expires_at')

  if (error) {
    console.error('[calendar-reminder] workspace query failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  for (const ws of workspaces ?? []) {
    if (!ws.owner_id) continue

    if (ws.license_type !== 'free') {
      if (ws.license_expires_at && new Date(ws.license_expires_at) < new Date()) continue
    }

    const { data: candidates } = await supabase
      .from('nmm_candidates')
      .select('*')
      .eq('workspace_id', ws.id)
      .eq('owner_id', ws.owner_id)

    const byDate = buildCalendarByDate((candidates ?? []) as NmmCandidate[])
    const dueToday = byDate[todayKey] ?? []
    if (dueToday.length === 0) continue

    for (const candidate of dueToday) {
      const { data: existing } = await supabase
        .from('nmm_notifications')
        .select('id')
        .eq('user_id', ws.owner_id)
        .eq('type', 'calendar')
        .eq('candidate_id', candidate.id)
        .gte('created_at', dayStart.toISOString())
        .limit(1)

      if (existing?.length) {
        results.push({ userId: ws.owner_id, candidateId: candidate.id, sent: false })
        continue
      }

      const { error: insertError } = await supabase.from('nmm_notifications').insert({
        user_id: ws.owner_id,
        candidate_id: candidate.id,
        title_tr: 'Takip zamanı geldi',
        title_en: 'Follow-up Reminder',
        description_tr: `${candidate.full_name} ile bugün yapmanız gereken sunum takibi var.`,
        description_en: `You have a scheduled presentation follow-up with ${candidate.full_name} today.`,
        type: 'calendar',
      })

      results.push({ userId: ws.owner_id, candidateId: candidate.id, sent: !insertError })
      if (insertError) {
        console.error(
          `[calendar-reminder] insert failed for ${ws.owner_id}/${candidate.id}:`,
          insertError,
        )
      }
    }
  }

  return NextResponse.json({
    ok: true,
    todayKey,
    processed: results.length,
    sent: results.filter(r => r.sent).length,
    results,
  })
}
