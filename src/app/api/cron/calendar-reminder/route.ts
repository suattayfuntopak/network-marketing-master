import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildCalendarByDate,
} from '@/lib/domain/calendarFollowUp'
import { todayCalendarKey } from '@/lib/utils/calendarDates'
import type { NmmCandidate } from '@/types/database.types'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const todayKey = todayCalendarKey()
  const results: { userId: string; count: number; sent: boolean }[] = []

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
    const todayCount = byDate[todayKey]?.length ?? 0
    if (todayCount === 0) continue

    const { data: existing } = await supabase
      .from('nmm_notifications')
      .select('id')
      .eq('user_id', ws.owner_id)
      .eq('type', 'calendar')
      .gte('created_at', dayStart.toISOString())
      .limit(1)

    if (existing?.length) {
      results.push({ userId: ws.owner_id, count: todayCount, sent: false })
      continue
    }

    const { error: insertError } = await supabase.from('nmm_notifications').insert({
      user_id: ws.owner_id,
      title_tr: 'Bugünkü takipleriniz 📅',
      title_en: 'Today\'s follow-ups 📅',
      description_tr: `Bugün ${todayCount} aday için planlı takip var. Takvimden kontrol edin.`,
      description_en: `You have ${todayCount} scheduled follow-ups today. Check your calendar.`,
      type: 'calendar',
    })

    results.push({ userId: ws.owner_id, count: todayCount, sent: !insertError })
    if (insertError) {
      console.error(`[calendar-reminder] insert failed for ${ws.owner_id}:`, insertError)
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
