import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cronAuthError } from '@/lib/infra/cronAuth'
import { istanbulDayStartIso, todayCalendarKey } from '@/lib/utils/calendarDates'

// Gecikmiş takipler (next_follow_up_at < now, ≤ 14 gün) için in-app bildirim.
// calendar-reminder aynı günlük takipleri zaten karşılar — bu cron sadece geçmişte kalanları yakalar.
export async function GET(request: NextRequest) {
  const authError = cronAuthError(request)
  if (authError) return authError

  const supabase = createAdminClient()
  const now = new Date()
  const todayKey = todayCalendarKey()
  const dayStartIso = istanbulDayStartIso(todayKey)
  const results: { userId: string; candidateId: string; sent: boolean }[] = []

  // Aktif workspace'ler — süresi dolmuş lisansları ele
  const { data: workspaces, error: wsError } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id, license_expires_at')

  if (wsError) {
    console.error('[overdue-reminders] workspace query failed:', wsError)
    return NextResponse.json({ error: wsError.message }, { status: 500 })
  }

  const activeWs = (workspaces ?? []).filter(
    ws =>
      ws.owner_id &&
      !(ws.license_expires_at && new Date(ws.license_expires_at) < now),
  )
  if (activeWs.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, sent: 0, results })
  }

  const wsIds = activeWs.map(ws => ws.id)
  const ownerIds = activeWs.map(ws => ws.owner_id as string)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString()
  // Dün gece sonu — bugünün takiplerini calendar-reminder zaten ele alır
  const yesterdayEndIso = new Date(now.getTime() - 86_400_000).toISOString()

  const { data: overdueCandidates } = await supabase
    .from('nmm_candidates')
    .select('id, full_name, owner_id, workspace_id')
    .in('workspace_id', wsIds)
    .lt('next_follow_up_at', yesterdayEndIso)
    .gte('next_follow_up_at', fourteenDaysAgo)
    .not('stage', 'in', '("katildi","ilgilenmedi","kayboldu","pasif")')
    .order('next_follow_up_at', { ascending: true })

  if (!overdueCandidates || overdueCandidates.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, sent: 0, results })
  }

  // Bugün zaten gönderilmiş overdue bildirimlerini çek
  const { data: existingToday } = await supabase
    .from('nmm_notifications')
    .select('user_id, candidate_id')
    .in('user_id', ownerIds)
    .eq('type', 'overdue_followup')
    .gte('created_at', dayStartIso)

  const alreadySent = new Set(
    (existingToday ?? []).map(n => `${n.user_id}:${n.candidate_id}`),
  )

  for (const c of overdueCandidates) {
    const key = `${c.owner_id}:${c.id}`
    if (alreadySent.has(key)) {
      results.push({ userId: c.owner_id, candidateId: c.id, sent: false })
      continue
    }

    const { error: insertError } = await supabase.from('nmm_notifications').insert({
      user_id: c.owner_id,
      candidate_id: c.id,
      title_tr: 'Gecikmiş takip',
      title_en: 'Overdue Follow-up',
      description_tr: `${c.full_name} için planlanan takip geçti — boru hattından güncelleyebilirsin.`,
      description_en: `Planned follow-up for ${c.full_name} is overdue — update it from the pipeline.`,
      type: 'overdue_followup',
    })

    results.push({ userId: c.owner_id, candidateId: c.id, sent: !insertError })
    if (insertError) {
      console.error(`[overdue-reminders] insert failed for ${c.owner_id}/${c.id}:`, insertError)
    } else {
      alreadySent.add(key)
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    sent: results.filter(r => r.sent).length,
    results,
  })
}
