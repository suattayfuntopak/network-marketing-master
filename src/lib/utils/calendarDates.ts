/** Yerel takvim anahtarları — UTC kayması olmadan YYYY-MM-DD. */

export function toCalendarKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromCalendarKey(key: string): Date {
  const [y, m, day] = key.split('-').map(Number)
  return new Date(y, m - 1, day, 12, 0, 0)
}

export function keysForDaysAfter(anchorKey: string, count: number): string[] {
  const anchor = fromCalendarKey(anchorKey)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(anchor)
    d.setDate(d.getDate() + i + 1)
    return toCalendarKey(d)
  })
}

/** Pazartesi başlangıçlı haftanın 7 günü (seçili günün bulunduğu hafta). */
export function weekKeysContaining(anchorKey: string): string[] {
  const anchor = fromCalendarKey(anchorKey)
  const mondayOffset = (anchor.getDay() + 6) % 7
  const monday = new Date(anchor)
  monday.setDate(anchor.getDate() - mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toCalendarKey(d)
  })
}
