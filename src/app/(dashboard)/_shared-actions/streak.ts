'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { computeActivityStreak } from '@/lib/domain/activityStreak'
import { todayCalendarKey, istanbulDayKey } from '@/lib/utils/calendarDates'

export interface ActivityStreak {
  /** Ardışık aktif-gün sayısı (bugün veya dün dahil; seri kopmuşsa 0). */
  current: number
}

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Kullanıcının `daily_active` olaylarından ardışık aktif-gün serisini hesaplar.
 * Gün anahtarı önce metadata.day'den (beacon İstanbul gününü yazar), yoksa
 * created_at'ın İstanbul gününden türetilir. 400 satır ≈ ~1 yıllık seri için yeter.
 */
export async function getActivityStreakAction(): Promise<ActivityStreak> {
  const supabase = await createClient()
  const { user } = await getAuthUser()
  if (!user) return { current: 0 }

  const { data } = await supabase
    .from('nmm_product_events')
    .select('metadata, created_at')
    .eq('user_id', user.id)
    .eq('event_name', PRODUCT_EVENTS.dailyActive)
    .order('created_at', { ascending: false })
    .limit(400)

  const keys = new Set<string>()
  for (const row of data ?? []) {
    const meta = row.metadata as Record<string, unknown> | null
    const day = typeof meta?.day === 'string' && DAY_KEY_RE.test(meta.day) ? meta.day : null
    keys.add(day ?? istanbulDayKey(row.created_at))
  }

  return { current: computeActivityStreak(keys, todayCalendarKey()) }
}
