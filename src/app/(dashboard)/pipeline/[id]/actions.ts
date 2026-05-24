'use server'

import { generateMessage } from '@/lib/ai/generateMessage'
import { createClient } from '@/lib/supabase/server'
import { DAILY_AI_LIMIT } from '@/lib/aiUsage'

const SUPER_ADMIN_EMAIL = 'suattayfuntopak@gmail.com'

export interface CoachState {
  message?: string
  error?: string
}

export async function generateCoachMessage(
  _prev: CoachState,
  formData: FormData,
): Promise<CoachState> {
  const candidateId = (formData.get('candidateId') as string | null)?.trim() ?? ''
  const name        = (formData.get('name')        as string | null)?.trim() ?? ''
  const stage       = (formData.get('stage')       as string | null)?.trim() ?? ''
  const note        = (formData.get('note')        as string | null)?.trim() ?? ''
  const messageType = (formData.get('messageType') as string | null)?.trim() ?? 'genel'

  if (!name || !stage) return { error: 'Kişi bilgisi eksik.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum gerekli.' }

  const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL

  // Ownership check: candidate must belong to caller's workspace
  if (candidateId && !isSuperAdmin) {
    const { data: membership } = await supabase
      .from('nmm_workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) return { error: 'Çalışma alanı bulunamadı.' }
    const { count } = await supabase
      .from('nmm_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('id', candidateId)
      .eq('workspace_id', membership.workspace_id)
    if ((count ?? 0) === 0) return { error: 'Erişim reddedildi.' }
  }

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
      return { error: `Günlük ${DAILY_AI_LIMIT} mesaj limitine ulaştınız. Yarın tekrar deneyin.` }
    }
  }

  const { data: membership } = await supabase
    .from('nmm_workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .maybeSingle()

  try {
    const message = await generateMessage({ name, stage, note, messageType })

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
