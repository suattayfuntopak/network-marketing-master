import type { AdminClient } from '@/lib/supabase/admin'
import type { TrialLifecycleKind } from '@/lib/domain/trialLifecycle'
import { TRIAL_PUSH_COPY, isTrialPushKind } from '@/lib/domain/trialLifecycle'

export function shouldSendTrialPush(kind: TrialLifecycleKind): boolean {
  return isTrialPushKind(kind)
}

export async function sendTrialLifecyclePush(
  supabase: AdminClient,
  userId: string,
  kind: TrialLifecycleKind,
): Promise<boolean> {
  if (!isTrialPushKind(kind)) return false

  const copy = TRIAL_PUSH_COPY[kind]

  const { error } = await supabase.from('nmm_notifications').insert({
    user_id: userId,
    type: 'info',
    title_tr: copy.title_tr,
    title_en: copy.title_en,
    description_tr: copy.description_tr,
    description_en: copy.description_en,
  })

  if (error) {
    console.error('[trialPush] insert failed:', kind, error)
    return false
  }
  return true
}
