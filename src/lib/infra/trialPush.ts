import type { AdminClient } from '@/lib/supabase/admin'
import type { TrialEmailKind } from '@/lib/infra/trialEmails'

const PUSH_KINDS = new Set<TrialEmailKind>(['trial_3d', 'trial_1d', 'trial_ended'])

export function shouldSendTrialPush(kind: TrialEmailKind): boolean {
  return PUSH_KINDS.has(kind)
}

export async function sendTrialLifecyclePush(
  supabase: AdminClient,
  userId: string,
  kind: TrialEmailKind,
  lang: 'tr' | 'en',
): Promise<boolean> {
  if (!shouldSendTrialPush(kind)) return false

  const copy =
    kind === 'trial_ended'
      ? {
          title_tr: 'Deneme bitti — YZ kilitlendi',
          title_en: 'Trial ended — AI locked',
          description_tr: 'NMM açık; Basic ile günlük YZ kotana devam et.',
          description_en: 'NMM stays open — continue with Basic daily AI.',
        }
      : kind === 'trial_1d'
        ? {
            title_tr: 'Denemen yarın bitiyor',
            title_en: 'Your trial ends tomorrow',
            description_tr: 'Basic planı incele — YZ erişimini kesintisiz sürdür.',
            description_en: 'Review Basic to keep AI access without interruption.',
          }
        : {
            title_tr: 'Denemene 3 gün kaldı',
            title_en: '3 days left on your trial',
            description_tr: 'Planları gör; Basic ile günlük 20 YZ mesajı.',
            description_en: 'View plans — Basic includes 20 daily AI messages.',
          }

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
