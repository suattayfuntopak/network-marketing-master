const STORAGE_PREFIX = 'nmm-academy-progress'

function getStorageKey(dateKey: string) {
  return `${STORAGE_PREFIX}:${dateKey}`
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function trackAcademyRead(contentId: string) {
  if (typeof window === 'undefined') return

  const todayKey = getTodayKey()
  const storageKey = getStorageKey(todayKey)
  const current = window.localStorage.getItem(storageKey)

  const parsed = current ? JSON.parse(current) as { ids?: string[] } : { ids: [] }
  const ids = Array.isArray(parsed.ids) ? parsed.ids : []

  if (!ids.includes(contentId)) {
    window.localStorage.setItem(storageKey, JSON.stringify({ ids: [...ids, contentId] }))
  }
}

export function getTodayAcademyReadCount() {
  if (typeof window === 'undefined') return 0

  const current = window.localStorage.getItem(getStorageKey(getTodayKey()))
  if (!current) return 0

  try {
    const parsed = JSON.parse(current) as { ids?: string[] }
    return Array.isArray(parsed.ids) ? parsed.ids.length : 0
  } catch {
    return 0
  }
}

