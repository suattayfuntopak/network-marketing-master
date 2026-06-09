'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { isSuperAdmin } from '@/lib/domain/auth'
import { istanbulDayStartIso, todayCalendarKey } from '@/lib/utils/calendarDates'

export interface AIUsageData {
  /** Tüm YZ aksiyonları (mesaj, koç, prova, uyum) — birleşik günlük kota. */
  aiUsed: number
  isSuperAdmin: boolean
}

/** Günlük YZ kullanım sayımı — sunucu UTC gece yarısı penceresi (checkQuota ile uyumlu). */
export async function fetchAIUsageAction(): Promise<AIUsageData> {
  const supabase = await createClient()
  const { user, error: userError } = await getAuthUser()

  if (userError || !user) {
    return {
      aiUsed: 0,
      isSuperAdmin: false,
    }
  }

  const superAdmin = isSuperAdmin(user)
  const dayStartIso = istanbulDayStartIso(todayCalendarKey())

  const { data, error } = await supabase
    .from('nmm_daily_actions')
    .select('note')
    .eq('user_id', user.id)
    .eq('action_type', 'ai_generate')
    .gte('created_at', dayStartIso)

  if (error) throw new Error(error.message)

  return {
    aiUsed: data?.length ?? 0,
    isSuperAdmin: superAdmin,
  }
}
