'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { createClient } from '@/lib/supabase/server'
import { DAILY_AI_LIMIT } from '@/lib/aiUsage'

const SUPER_ADMIN_EMAIL = 'suattayfuntopak@gmail.com'

export interface YazarFormState {
  message?: string
  error?: string
  remaining?: number
}

export async function generateMessageAction(
  _prev: YazarFormState,
  formData: FormData
): Promise<YazarFormState> {
  const name        = (formData.get('name')        as string | null)?.trim() ?? ''
  const stage       = (formData.get('stage')       as string | null)?.trim() ?? ''
  const context     = (formData.get('context')     as string | null)?.trim() ?? ''
  const tone        = (formData.get('tone')        as string | null)?.trim() ?? 'samimi'
  const messageType = (formData.get('messageType') as string | null)?.trim() ?? 'genel'
  const warmth      = (formData.get('warmth')      as string | null)?.trim() ?? 'ilik'

  if (!name) return { error: 'Kişi adı zorunlu.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum gerekli.' }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  if (!isSuperAdmin) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('nmm_daily_actions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_type', 'ai_generate')
      .gte('created_at', today.toISOString())

    if ((count ?? 0) >= DAILY_AI_LIMIT) {
      return { error: `Günlük ${DAILY_AI_LIMIT} mesaj limitine ulaştınız. Yarın tekrar deneyin.`, remaining: 0 }
    }
  }

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  try {
    const message = await generateMessage({ name, stage, context, tone, messageType, warmth })

    if (membership && !isSuperAdmin) {
      await supabase.from('nmm_daily_actions').insert({
        workspace_id: membership.workspace_id,
        user_id: user.id,
        candidate_id: null,
        action_type: 'ai_generate' as const,
      })
    }

    return { message }
  } catch {
    return { error: 'Mesaj oluşturulamadı.' }
  }
}
