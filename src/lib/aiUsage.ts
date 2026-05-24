// Günlük AI mesaj limiti — freemium soft limit, localStorage tabanlı

const KEY_PREFIX = 'nmm_ai_usage_'
export const DAILY_AI_LIMIT = 20

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
