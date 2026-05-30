import { calendarFollowUpKey, followUpDueStatus, isFollowUpDue } from '@/lib/domain/calendarFollowUp'
import { todayCalendarKey } from '@/lib/utils/calendarDates'
import type { NmmCandidate } from '@/types/database.types'

const MAX_DAILY_CANDIDATES = 5

const STAGE_PRIORITY: Record<NmmCandidate['stage'], number> = {
  takip: 0,
  davetli: 1,
  sunum: 2,
  kararsiz: 3,
  iletisim: 4,
  yeni: 5,
  katildi: 9,
  ilgilenmedi: 9,
  pasif: 9,
  kayboldu: 9,
}

function daysSince(isoDate: string | null): number {
  if (!isoDate) return Infinity
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24)
}

export interface DailyCandidate extends NmmCandidate {
  daysSinceContact: number
  followUpStatus: 'past' | 'today'
  followUpKey: string
}

export interface DailyActionsResult {
  daily: DailyCandidate[]
  remaining: number
  all: DailyCandidate[]
}

/** Bugün İlgilen — takvim formülüyle aynı kaynak (bugün + gecikmiş takipler). */
export function buildDailyPriorities(
  candidates: NmmCandidate[],
  todayKey: string = todayCalendarKey(),
  maxDaily = MAX_DAILY_CANDIDATES,
): DailyActionsResult {
  const actionable = candidates
    .filter(c => isFollowUpDue(c, todayKey))
    .map(c => {
      const status = followUpDueStatus(c, todayKey)!
      const key = calendarFollowUpKey(c)!
      return {
        ...c,
        daysSinceContact: daysSince(c.last_contact_at),
        followUpStatus: status as 'past' | 'today',
        followUpKey: key,
      }
    })
    .sort((a, b) => {
      if (a.followUpStatus !== b.followUpStatus) {
        return a.followUpStatus === 'past' ? -1 : 1
      }
      const stageDiff = STAGE_PRIORITY[a.stage] - STAGE_PRIORITY[b.stage]
      if (stageDiff !== 0) return stageDiff
      return a.followUpKey.localeCompare(b.followUpKey)
    })

  return {
    daily: actionable.slice(0, maxDaily),
    remaining: Math.max(0, actionable.length - maxDaily),
    all: actionable,
  }
}
