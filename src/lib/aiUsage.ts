// Günlük AI mesaj limitleri - Lisans tipine göre dinamik olarak yönetilir.

export interface AILimits {
  messageLimit: number
  roleplayLimit: number
  complianceLimit: number
}

export function getLimitsForLicense(licenseType: string | null | undefined): AILimits {
  switch (licenseType) {
    case 'pro':
      return { messageLimit: 100, roleplayLimit: 60, complianceLimit: 15 }
    case 'master': // Plus Plan
      return { messageLimit: 40, roleplayLimit: 25, complianceLimit: 5 }
    case 'leader': // Basic Plan (previously leader)
      return { messageLimit: 15, roleplayLimit: 10, complianceLimit: 2 }
    case 'free':
    default:
      // Free / Trial limits
      return { messageLimit: 15, roleplayLimit: 10, complianceLimit: 2 }
  }
}

// Geriye dönük uyumluluk için varsayılan limit sabitleri ve local storage takibi
export const DAILY_AI_LIMIT = 20
export const DAILY_ROLEPLAY_LIMIT = 20
export const DAILY_COMPLIANCE_LIMIT = 5
export const DAILY_MESSAGE_LIMIT = 25

const KEY_PREFIX = 'nmm_ai_usage_'

function todayKey(): string {
  return KEY_PREFIX + new Date().toISOString().slice(0, 10)
}

export function getAIUsageToday(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(todayKey()) ?? '0', 10)
}

export function incrementAIUsage(bypass: boolean = false): number {
  if (bypass) return getAIUsageToday()
  const count = getAIUsageToday() + 1
  localStorage.setItem(todayKey(), String(count))
  return count
}

export function isAILimitReached(bypass: boolean = false): boolean {
  if (bypass) return false
  return getAIUsageToday() >= DAILY_AI_LIMIT
}

export function remainingAIUsage(bypass: boolean = false): number | string {
  if (bypass) return 'Sınırsız'
  return Math.max(0, DAILY_AI_LIMIT - getAIUsageToday())
}
