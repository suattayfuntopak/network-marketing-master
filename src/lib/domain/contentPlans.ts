/** İçerik takvimi planları — sıralama (SAF, test edilebilir). */

export interface ContentPlanRecord {
  id: string
  platform: string
  scheduled_for: string
  body: string
  is_posted: boolean
}

/**
 * Planlanmış (paylaşılmamış) içerikler en yakın tarihten uzağa; paylaşılanlar
 * en sona (yeniden eskiye). Distribütör "sırada ne var"ı en üstte görür.
 */
export function sortContentPlans<T extends ContentPlanRecord>(plans: T[]): T[] {
  return [...plans].sort((a, b) => {
    if (a.is_posted !== b.is_posted) return a.is_posted ? 1 : -1
    return a.is_posted
      ? b.scheduled_for.localeCompare(a.scheduled_for)
      : a.scheduled_for.localeCompare(b.scheduled_for)
  })
}
