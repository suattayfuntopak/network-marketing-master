import { getStageLabel } from '@/lib/domain/stages'
import { displayDailyActionNote, isLeaderUserNote } from '@/lib/domain/dailyActionNote'
import { renderActivityText } from '@/app/(dashboard)/pipeline/[id]/_components/candidateDetailUtils'
import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import type { NmmCandidate, NmmDailyAction } from '@/types/database.types'

type TFunc = (k: string, v?: Record<string, string | number>) => string

const WARMTH_KEYS: Record<string, { tr: string; en: string }> = {
  sicak: { tr: 'Sıcak (Hot) 🔥', en: 'Hot 🔥' },
  ilik: { tr: 'Ilık (Warm) ☀️', en: 'Warm ☀️' },
  soguk: { tr: 'Soğuk (Cold) ❄️', en: 'Cold ❄️' },
}

function warmthLabel(warmth: string, lang: 'tr' | 'en'): string {
  return WARMTH_KEYS[warmth]?.[lang] ?? warmth
}

/** Yazar formu bağlam metni — renderActivityText ile aktivite satırları. */
export function formatCandidateContextForYazar(
  c: NmmCandidate,
  rawActions: NmmDailyAction[],
  lang: 'tr' | 'en',
  t: TFunc,
): string {
  const parsed = resolveCandidateFields(c)
  const parsedNote = lang === 'en' ? (parsed.noteEn || parsed.noteTr) : parsed.noteTr
  const stageName = getStageLabel(c.stage, lang) || c.stage
  const warmthText = warmthLabel(parsed.warmth || 'ilik', lang)

  const leaderNotes = rawActions.filter(a => isLeaderUserNote(a))
  const activities = rawActions.slice(0, 5)
  const locale = lang === 'en' ? 'en-US' : 'tr-TR'

  const notesText =
    leaderNotes.length > 0
      ? (lang === 'en' ? '\n\nLeader Notes:\n' : '\n\nLider Notları:\n') +
        leaderNotes
          .map(n => `- ${displayDailyActionNote(n, lang)}`)
          .join('\n')
      : ''

  const activityLines = activities
    .map(a => {
      const dateStr = new Date(a.created_at).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
      })
      const actionText = renderActivityText(a, lang, t)
      return `- ${dateStr}: ${actionText}`
    })
    .join('\n')

  const activitiesText =
    activities.length > 0
      ? (lang === 'en' ? '\n\nRecent Activities:\n' : '\n\nSon Aktiviteler:\n') + activityLines
      : ''

  if (lang === 'en') {
    return `Candidate: ${c.full_name}\nRelationship: ${warmthText}\nStage: ${stageName}${parsedNote ? `\nNotes: ${parsedNote}` : ''}${notesText}${activitiesText}\n\n`
  }
  return `Aday: ${c.full_name}\nİlişki Derecesi: ${warmthText}\nAşama: ${stageName}${parsedNote ? `\nNotlar: ${parsedNote}` : ''}${notesText}${activitiesText}\n\n`
}
