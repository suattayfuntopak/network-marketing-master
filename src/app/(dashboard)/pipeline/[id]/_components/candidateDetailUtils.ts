import { FOLLOW_DAYS } from '@/lib/domain/stages'
import {
  displayDailyActionNote,
  getWhatsAppActivityDisplay,
} from '@/lib/domain/dailyActionNote'
import type { NmmCandidate } from '@/types/database.types'

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function renderActivityText(a: any, lang: string, t: TFunc): string {
  const warmthMap: Record<string, { tr: string; en: string }> = {
    sicak: { tr: 'Sıcak 🔥', en: 'Hot 🔥' },
    ilik: { tr: 'Ilık ☀️', en: 'Warm ☀️' },
    soguk: { tr: 'Soğuk ❄️', en: 'Cold ❄️' },
  }

  if (a.action_type === 'call') {
    return t('pipeline.activityCall')
  }
  if (a.action_type === 'whatsapp') {
    const labeled = getWhatsAppActivityDisplay(a, lang === 'en' ? 'en' : 'tr')
    if (labeled) return labeled
    return t('pipeline.activityWhatsApp')
  }
  if (a.action_type === 'ai_generate') {
    return t('pipelinePage.aiMessageGenerated')
  }
  if (a.action_type === 'stage_change') {
    const rawNote = (a.note || '').toLowerCase().trim()
    const stageKeyMap: Record<string, string> = {
      'yeni': 'yeni',
      'iletisim': 'iletisim',
      'iletişime geçildi': 'iletisim',
      'davetli': 'davetli',
      'davet edildi': 'davetli',
      'sunum': 'sunum',
      'sunum yapıldı': 'sunum',
      'takip': 'takip',
      'takipte': 'takip',
      'kararsiz': 'kararsiz',
      'kararsız': 'kararsiz',
      'katildi': 'katildi',
      'katıldı': 'katildi',
      'joined': 'katildi',
      'ilgilenmedi': 'ilgilenmedi',
      'pasif': 'pasif',
      'kayboldu': 'kayboldu',
      'kaybedildi': 'kayboldu',
    }
    const resolvedKey = stageKeyMap[rawNote] || rawNote
    const stageName = t(`stages.${resolvedKey}`) || a.note || ''
    return t('pipelinePage.stageChangedTo', { stage: stageName })
  }
  if (a.action_type === 'note') {
    if (a.note?.startsWith('system_note:candidate_created')) {
      return t('pipelinePage.candidateProfileCreated')
    }
    if (a.note?.startsWith('system_note:profile_update')) {
      return t('pipelinePage.profileDetailsUpdated')
    }
    if (a.note?.startsWith('system_note:warmth_change:')) {
      const parts = a.note.replace('system_note:warmth_change:', '').split('->')
      const oldW = warmthMap[parts[0]] ? warmthMap[parts[0]][lang === 'en' ? 'en' : 'tr'] : parts[0]
      const newW = warmthMap[parts[1]] ? warmthMap[parts[1]][lang === 'en' ? 'en' : 'tr'] : parts[1]
      return t('pipelinePage.warmthUpdated', { old: oldW, new: newW })
    }
    if (a.note?.startsWith('system_note:follow_up_change:')) {
      const parts = a.note.replace('system_note:follow_up_change:', '').split('->')
      const formatD = (val: string) => {
        if (val === 'none' || !val) return t('pipelinePage.none')
        try {
          return new Date(val).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        } catch { return val }
      }
      return t('pipelinePage.followUpDateChanged', { old: formatD(parts[0]), new: formatD(parts[1]) })
    }

    const displayNote = displayDailyActionNote(a, lang === 'en' ? 'en' : 'tr')
    return `${t('pipelinePage.leaderNoteAdded')}: "${displayNote}"`
  }
  return a.note || ''
}
