'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/authUser'
import { isSuperAdmin } from '@/lib/domain/auth'

export interface AIUsageData {
  roleplayUsed: number
  complianceUsed: number
  messageUsed: number
  isSuperAdmin: boolean
}

/** Günlük YZ kullanım sayımı — sunucu UTC gece yarısı penceresi (checkQuota ile uyumlu). */
export async function fetchAIUsageAction(): Promise<AIUsageData> {
  const supabase = await createClient()
  const { user, error: userError } = await getAuthUser()

  if (userError || !user) {
    return {
      roleplayUsed: 0,
      complianceUsed: 0,
      messageUsed: 0,
      isSuperAdmin: false,
    }
  }

  const superAdmin = isSuperAdmin(user)
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const { data, error } = await supabase
    .from('nmm_daily_actions')
    .select('note')
    .eq('user_id', user.id)
    .eq('action_type', 'ai_generate')
    .gte('created_at', today.toISOString())

  if (error) throw new Error(error.message)

  let roleplayUsed = 0
  let complianceUsed = 0
  let messageUsed = 0

  for (const act of data ?? []) {
    if (act.note === 'roleplay') roleplayUsed++
    else if (act.note === 'compliance') complianceUsed++
    else messageUsed++
  }

  return {
    roleplayUsed,
    complianceUsed,
    messageUsed,
    isSuperAdmin: superAdmin,
  }
}
