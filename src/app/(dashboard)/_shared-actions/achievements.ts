'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { computeActivityStreak } from '@/lib/domain/activityStreak'
import { computeAchievements, type AchievementsResult } from '@/lib/domain/achievements'
import { todayCalendarKey, istanbulDayKey } from '@/lib/utils/calendarDates'

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Kullanıcının kazanılmış rozetlerini mevcut metriklerden türetir (streak +
 * aday sayısı + ekip boyu). Yeni tablo yok; hesaplama saf `computeAchievements`'te.
 */
export async function getAchievementsAction(): Promise<AchievementsResult> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return computeAchievements({ streak: 0, candidateCount: 0, teamSize: 0 })

  const { data: wsm } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()
  const workspaceId = wsm?.workspace_id ?? null

  const [daRes, candRes, downRes] = await Promise.all([
    supabase
      .from('nmm_product_events')
      .select('metadata, created_at')
      .eq('user_id', user.id)
      .eq('event_name', PRODUCT_EVENTS.dailyActive)
      .order('created_at', { ascending: false })
      .limit(400),
    workspaceId
      ? supabase
          .from('nmm_candidates')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)
      : Promise.resolve({ count: 0 }),
    supabase.rpc('nmm_leader_downline_workspaces'),
  ])

  const keys = new Set<string>()
  for (const row of daRes.data ?? []) {
    const meta = row.metadata as Record<string, unknown> | null
    const day = typeof meta?.day === 'string' && DAY_KEY_RE.test(meta.day) ? meta.day : null
    keys.add(day ?? istanbulDayKey(row.created_at))
  }

  const streak = computeActivityStreak(keys, todayCalendarKey())
  const candidateCount = candRes.count ?? 0
  const teamSize = downRes.data?.length ?? 0

  return computeAchievements({ streak, candidateCount, teamSize })
}
