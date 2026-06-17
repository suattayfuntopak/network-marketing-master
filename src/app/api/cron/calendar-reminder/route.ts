import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cronAuthError } from '@/lib/infra/cronAuth'
import { buildCalendarByDate } from '@/lib/domain/calendarFollowUp'
import { todayCalendarKey, istanbulDayStartIso } from '@/lib/utils/calendarDates'
import type { NmmCandidate } from '@/types/database.types'

export async function GET(request: NextRequest) {
  const authError = cronAuthError(request)
  if (authError) return authError

  const supabase = createAdminClient()
  const todayKey = todayCalendarKey()
  const results: { userId: string; candidateId: string; sent: boolean }[] = []

  // İstanbul takvim günü başlangıcı — todayKey ile aynı günü kapsar (UTC kayması yok).
  const dayStartIso = istanbulDayStartIso(todayKey)
  const now = new Date()

  const { data: workspaces, error } = await supabase
    .from('nmm_workspaces')
    .select('id, owner_id, license_type, license_expires_at')

  if (error) {
    console.error('[calendar-reminder] workspace query failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Lisansı dolmuş workspace'leri (free trial dahil) ele; geri kalanı işle.
  const activeWs = (workspaces ?? []).filter(
    ws =>
      ws.owner_id &&
      !(ws.license_expires_at && new Date(ws.license_expires_at) < now),
  )
  if (activeWs.length === 0) {
    return NextResponse.json({ ok: true, todayKey, processed: 0, sent: 0 })
  }

  // O-9: aday ve mevcut bildirimleri tek batch sorguyla çek, N+1'i kaldır.
  const wsIds = activeWs.map(ws => ws.id)
  const ownerIds = activeWs.map(ws => ws.owner_id as string)

  const { data: allCandidates } = await supabase
    .from('nmm_candidates')
    .select('*')
    .in('workspace_id', wsIds)

  const candidatesByWs = new Map<string, NmmCandidate[]>()
  for (const c of (allCandidates ?? []) as NmmCandidate[]) {
    const list = candidatesByWs.get(c.workspace_id) ?? []
    list.push(c)
    candidatesByWs.set(c.workspace_id, list)
  }

  const { data: existingToday } = await supabase
    .from('nmm_notifications')
    .select('user_id, candidate_id')
    .in('user_id', ownerIds)
    .eq('type', 'calendar')
    .gte('created_at', dayStartIso)

  const alreadySent = new Set(
    (existingToday ?? []).map(n => `${n.user_id}:${n.candidate_id}`),
  )

  for (const ws of activeWs) {
    const ownerId = ws.owner_id as string
    const wsCandidates = (candidatesByWs.get(ws.id) ?? []).filter(
      c => c.owner_id === ownerId,
    )
    const byDate = buildCalendarByDate(wsCandidates)
    const dueToday = byDate[todayKey] ?? []

    for (const candidate of dueToday) {
      if (alreadySent.has(`${ownerId}:${candidate.id}`)) {
        results.push({ userId: ownerId, candidateId: candidate.id, sent: false })
        continue
      }

      const { error: insertError } = await supabase.from('nmm_notifications').insert({
        user_id: ownerId,
        candidate_id: candidate.id,
        title_tr: 'Takip zamanı geldi',
        title_en: 'Follow-up Reminder',
        description_tr: `${candidate.full_name} ile bugün yapmanız gereken sunum takibi var.`,
        description_en: `You have a scheduled presentation follow-up with ${candidate.full_name} today.`,
        type: 'calendar',
      })

      results.push({ userId: ownerId, candidateId: candidate.id, sent: !insertError })
      if (insertError) {
        console.error(
          `[calendar-reminder] insert failed for ${ownerId}/${candidate.id}:`,
          insertError,
        )
      } else {
        alreadySent.add(`${ownerId}:${candidate.id}`)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    todayKey,
    processed: results.length,
    sent: results.filter(r => r.sent).length,
  })
}
