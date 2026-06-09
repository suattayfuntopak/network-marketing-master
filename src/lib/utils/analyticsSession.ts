const STORAGE_KEY = 'nmm_analytics_session'

/** Anonim landing ziyaretçileri için oturum kimliği (localStorage). */
export function getAnalyticsSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}
