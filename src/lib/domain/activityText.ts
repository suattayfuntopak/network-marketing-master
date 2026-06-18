import {
  displayDailyActionNote,
  getWhatsAppActivityDisplay,
  isSystemActionNote,
} from '@/lib/domain/dailyActionNote'
import { fromCalendarKey } from '@/lib/utils/calendarDates'

type TFunc = (k: string, v?: Record<string, string | number>) => string

export type ActivityRow = {
  action_type: string
  note: string | null
  note_tr?: string | null
  note_en?: string | null
}

/**
 * Aktivite günlüğü satırını yerelleştirilmiş okunabilir metne çevirir.
 * Platform-agnostik domain yardımcısı — UI bileşeni (`candidateDetailUtils`) ve
 * Yazar bağlamı (`yazarCandidateContext`) tarafından paylaşılır.
 */
export function renderActivityText(a: ActivityRow, lang: string, t: TFunc): string {
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
    if (a.note?.startsWith('system_note:follow_up_cleared:')) {
      const dateKey = a.note.replace('system_note:follow_up_cleared:', '')
      let formatted = dateKey
      try {
        formatted = fromCalendarKey(dateKey).toLocaleDateString(
          lang === 'en' ? 'en-US' : 'tr-TR',
          { day: 'numeric', month: 'long', year: 'numeric' },
        )
      } catch { /* keep raw key */ }
      return t('pipelinePage.followUpCleared', { date: formatted })
    }
    if (isSystemActionNote(a.note)) {
      return t('pipelinePage.systemActivityRecorded')
    }

    const displayNote = displayDailyActionNote(a, lang === 'en' ? 'en' : 'tr')
    return `${t('pipelinePage.leaderNoteAdded')}: "${displayNote}"`
  }
  return a.note || ''
}
