'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { isSuperAdmin } from '@/lib/domain/auth'

export interface AIUsageData {
  roleplayUsed: number
  complianceUsed: number
  messageUsed: number
  isSuperAdmin: boolean
}

export function useAIUsage() {
  return useQuery<AIUsageData>({
    queryKey: ['daily-ai-usage'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return {
          roleplayUsed: 0,
          complianceUsed: 0,
          messageUsed: 0,
          isSuperAdmin: false,
        }
      }

      const superAdmin = isSuperAdmin(user)

      // Sunucu kota penceresi (checkQuota.ts) Vercel'de UTC gece yarısını kullanır.
      // İstemci sayımının enforcement ile eşleşmesi için burada da UTC gece yarısı.
      const now = new Date()
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

      // Fetch today's AI generation actions
      const { data, error } = await supabase
        .from('nmm_daily_actions')
        .select('note')
        .eq('user_id', user.id)
        .eq('action_type', 'ai_generate')
        .gte('created_at', today.toISOString())

      if (error) {
        console.error('Failed to fetch daily AI actions:', error)
        throw new Error(error.message)
      }

      let roleplayUsed = 0
      let complianceUsed = 0
      let messageUsed = 0

      if (data) {
        data.forEach(act => {
          if (act.note === 'roleplay') {
            roleplayUsed++
          } else if (act.note === 'compliance') {
            complianceUsed++
          } else {
            messageUsed++
          }
        })
      }

      return {
        roleplayUsed,
        complianceUsed,
        messageUsed,
        isSuperAdmin: superAdmin,
      }
    },
    refetchOnWindowFocus: false,
  })
}
