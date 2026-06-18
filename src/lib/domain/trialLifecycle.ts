/** Deneme yaşam döngüsü e-posta/push senaryoları — tek kaynak kopya. */
export type TrialLifecycleKind = 'trial_mid' | 'trial_3d' | 'trial_1d' | 'trial_ended' | 'trial_15d'

export type TrialPushKind = Extract<TrialLifecycleKind, 'trial_3d' | 'trial_1d' | 'trial_ended'>

export const TRIAL_PUSH_KINDS: readonly TrialPushKind[] = ['trial_3d', 'trial_1d', 'trial_ended']

export function isTrialPushKind(kind: TrialLifecycleKind): kind is TrialPushKind {
  return (TRIAL_PUSH_KINDS as readonly string[]).includes(kind)
}

export const TRIAL_EMAIL_CTA = {
  tr: 'Planları incele ve devam et →',
  en: 'View plans & continue →',
} as const

type PushCopy = {
  title_tr: string
  title_en: string
  description_tr: string
  description_en: string
}

/** Uygulama içi push bildirim metinleri (trialPush.ts tüketir). */
export const TRIAL_PUSH_COPY: Record<TrialPushKind, PushCopy> = {
  trial_ended: {
    title_tr: 'Deneme bitti — YZ kilitlendi',
    title_en: 'Trial ended — AI locked',
    description_tr: 'NMM açık kalıyor — plan seçerek YZ\'yi yeniden aç.',
    description_en: 'NMM stays open — pick a plan to unlock AI again.',
  },
  trial_1d: {
    title_tr: 'Denemen yarın bitiyor',
    title_en: 'Your trial ends tomorrow',
    description_tr: 'Planları incele — YZ erişimini kesintisiz sürdür.',
    description_en: 'View plans to keep AI access without interruption.',
  },
  trial_3d: {
    title_tr: 'Denemene 3 gün kaldı',
    title_en: '3 days left on your trial',
    description_tr: 'Basic, Plus veya Pro planlarını incele.',
    description_en: 'Review Basic, Plus, or Pro plans.',
  },
}

/** Deneme CTA e-postaları — plan karşılaştırma sayfası (Shopier doğrudan değil). */
export function trialLifecyclePaymentPath(_kind?: TrialLifecycleKind): '/odeme' {
  return '/odeme'
}

/** Bildirim başlığından seePlansClick phase türetir. */
export function trialNotificationPhase(
  title_tr?: string | null,
  title_en?: string | null,
): 'trial' | 'ended' {
  const tr = (title_tr ?? '').toLowerCase()
  const en = (title_en ?? '').toLowerCase()
  if (
    tr.includes('deneme bitti') ||
    tr.includes('yz kilitlendi') ||
    en.includes('trial ended') ||
    en.includes('ai locked')
  ) {
    return 'ended'
  }
  return 'trial'
}
