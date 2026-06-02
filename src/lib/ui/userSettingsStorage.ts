import {
  DEFAULT_USER_SETTINGS,
  mergeUserSettings,
  type UserSettings,
} from '@/lib/domain/userSettings'

const CACHE_PREFIX = 'nmm_user_settings_'
const LEGACY_ONBOARDING_KEY = 'nmm_onboarding_done'
const LEGACY_CHECKLIST_KEY = 'nmm_compliance_checklist_v1'

function cacheKey(userId: string): string {
  return `${CACHE_PREFIX}${userId}`
}

/** Anlık flash önleyici — doğruluk kaynağı Supabase. */
export function readUserSettingsCache(userId: string | undefined | null): UserSettings | null {
  if (!userId || typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(cacheKey(userId))
    return raw ? mergeUserSettings(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function writeUserSettingsCache(userId: string, settings: UserSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(settings))
  } catch { /* ignore quota */ }
}

/** Eski global anahtarlar (kullanıcı izolasyonu yoktu) — bir kez okunup temizlenir. */
export function readLegacyUserSettingsGlobals(): Partial<UserSettings> {
  if (typeof window === 'undefined') return {}
  const patch: Partial<UserSettings> = {}
  try {
    if (localStorage.getItem(LEGACY_ONBOARDING_KEY)) {
      patch.onboardingDone = true
    }
    const rawChecklist = localStorage.getItem(LEGACY_CHECKLIST_KEY)
    if (rawChecklist) {
      const parsed = JSON.parse(rawChecklist)
      if (parsed && typeof parsed === 'object') {
        patch.complianceChecklist = parsed as Record<string, boolean>
      }
    }
  } catch { /* ignore */ }
  return patch
}

export function clearLegacyUserSettingsGlobals(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LEGACY_ONBOARDING_KEY)
    localStorage.removeItem(LEGACY_CHECKLIST_KEY)
  } catch { /* ignore */ }
}

export function mergeWithDefaults(partial: Partial<UserSettings>): UserSettings {
  return {
    onboardingDone: partial.onboardingDone ?? DEFAULT_USER_SETTINGS.onboardingDone,
    complianceChecklist: partial.complianceChecklist ?? DEFAULT_USER_SETTINGS.complianceChecklist,
  }
}
