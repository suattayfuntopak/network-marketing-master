/**
 * Kullanıcıya özel kalıcı ayarlar — Supabase `nmm_user_settings.settings` (jsonb)
 * içinde saklanır. localStorage YALNIZCA anlık (flash önleyici) önbellek olarak
 * kullanılabilir; doğruluk kaynağı her zaman Supabase'tir.
 */
export interface UserSettings {
  /** Pano karşılama (onboarding) akışı tamamlandı/atlandı mı. */
  onboardingDone: boolean
  /** Uyum Merkezi paylaşım checklist'i — { '<madde-id>': işaretli } */
  complianceChecklist: Record<string, boolean>
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  onboardingDone: false,
  complianceChecklist: {},
}

/** Ham jsonb'yi güvenli, tam UserSettings'e indirger (eksik/bozuk alanlar → default). */
export function mergeUserSettings(raw: unknown): UserSettings {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const checklist =
    obj.complianceChecklist && typeof obj.complianceChecklist === 'object'
      ? (obj.complianceChecklist as Record<string, boolean>)
      : {}
  return {
    onboardingDone: obj.onboardingDone === true,
    complianceChecklist: checklist,
  }
}
