import { FOLLOW_DAYS } from '@/lib/domain/stages'
import { toCalendarKey } from '@/lib/utils/calendarDates'
import type { NmmCandidate, CandidateStage } from '@/types/database.types'

/** Takvimde otomatik takip hesaplanmayan terminal aşamalar. Manuel tarih varsa gösterilir. */
export const CALENDAR_TERMINAL_STAGES: CandidateStage[] = [
  'katildi',
  'ilgilenmedi',
  'kayboldu',
  'pasif',
]

export function calendarFollowUpDate(c: NmmCandidate): Date | null {
  if (c.next_follow_up_at) {
    const d = new Date(c.next_follow_up_at)
    d.setHours(12, 0, 0, 0)
    return d
  }

  if (CALENDAR_TERMINAL_STAGES.includes(c.stage)) return null

  const days = FOLLOW_DAYS[c.stage]
  if (!days) return null

  const base = new Date(c.last_contact_at ?? c.created_at)
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d
}

export function buildCalendarByDate(
  candidates: NmmCandidate[],
): Record<string, NmmCandidate[]> {
  const map: Record<string, NmmCandidate[]> = {}
  for (const c of candidates) {
    const d = calendarFollowUpDate(c)
    if (!d) continue
    const k = toCalendarKey(d)
    ;(map[k] ??= []).push(c)
  }
  return map
}

export function countOverdueFollowUps(
  byDate: Record<string, NmmCandidate[]>,
  todayKey: string,
): number {
  let count = 0
  for (const [key, list] of Object.entries(byDate)) {
    if (key < todayKey) count += list.length
  }
  return count
}

export function earliestOverdueKey(
  byDate: Record<string, NmmCandidate[]>,
  todayKey: string,
): string | null {
  const keys = Object.keys(byDate)
    .filter(k => k < todayKey)
    .sort()
  return keys[0] ?? null
}

export function getOverdueCandidates(
  byDate: Record<string, NmmCandidate[]>,
  todayKey: string,
): NmmCandidate[] {
  const result: NmmCandidate[] = []
  for (const [key, list] of Object.entries(byDate)) {
    if (key < todayKey) result.push(...list)
  }
  return result
}

export function monthCalendarStats(
  viewYear: number,
  viewMonth: number,
  byDate: Record<string, NmmCandidate[]>,
  todayKey: string,
): { total: number; overdue: number } {
  const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`
  let total = 0
  let overdue = 0
  for (const [key, list] of Object.entries(byDate)) {
    if (!key.startsWith(prefix)) continue
    total += list.length
    if (key < todayKey) overdue += list.length
  }
  return { total, overdue }
}

/** Seçili günde takip yoksa: önce gelecek, yoksa geçmiş en yakın gün. */
export function nearestFollowUpKey(
  selectedKey: string,
  byDate: Record<string, NmmCandidate[]>,
): string | null {
  const keys = Object.keys(byDate).sort()
  const future = keys.find(k => k > selectedKey)
  if (future) return future
  const past = [...keys].reverse().find(k => k < selectedKey)
  return past ?? null
}
