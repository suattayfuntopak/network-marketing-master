import { FOLLOW_DAYS } from '@/lib/domain/stages'
import type { NmmCandidate } from '@/types/database.types'

// Y-2: aktivite metni render'ı platform-agnostik domain'e taşındı; UI tüketicileri
// (ActivityLogCard) geriye-uyum için buradan re-export ile kullanmaya devam eder.
export { renderActivityText } from '@/lib/domain/activityText'

type TFunc = (k: string, v?: Record<string, string | number>) => string

export function suggestedFollowUp(c: NmmCandidate, lang: string): string | null {
  const days = FOLLOW_DAYS[c.stage]
  if (!days) return null
  const base = new Date(c.last_contact_at ?? c.created_at)
  base.setDate(base.getDate() + days)
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  return base.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
}

export function daysSince(iso: string | null, t: TFunc): string {
  if (!iso) return t('common.noContact')
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (d === 0) return t('common.today')
  if (d === 1) return t('common.yesterday')
  return t('common.daysAgo', { days: d })
}

export function toInputDateTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => n.toString().padStart(2, '0')
  const YYYY = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const DD = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${YYYY}-${MM}-${DD}T${hh}:${mm}`
}

/** Bugünden `days` gün sonra; mevcut takip saati korunur, yoksa 15:00. */
export function quickFollowUpFromToday(days: number, existingIso: string | null): string {
  const result = new Date()
  result.setDate(result.getDate() + days)
  if (existingIso) {
    const existing = new Date(existingIso)
    if (!isNaN(existing.getTime())) {
      result.setHours(existing.getHours(), existing.getMinutes(), 0, 0)
      return result.toISOString()
    }
  }
  result.setHours(15, 0, 0, 0)
  return result.toISOString()
}

export function formatFollowUpDate(iso: string | null, lang: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'
  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

