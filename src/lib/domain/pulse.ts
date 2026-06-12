import { TRAINING_VIDEOS } from '@/lib/domain/trainingVideos'
import {
  summarizeVideoProgress,
  videoDropoffCount,
  type VideoProgressSummary,
} from '@/lib/domain/videoProgress'
import {
  todayCalendarKey,
  fromCalendarKey,
  toCalendarKey,
  istanbulDayStartIso,
  istanbulDayKey,
} from '@/lib/utils/calendarDates'

/** Canonical content counts (F1 — static library sizes). */
export const CANONICAL_TRAINING_COUNT = 30
export const CANONICAL_OBJECTION_COUNT = 34
export const ONBOARDING_STEP_COUNT = 9

export type PulsePeriod = 'today' | '7d' | '30d' | 'ytd' | 'all'

/** Aktivite sheet — Saha Özetim ile hizalı dönem sekmeleri (Tüm Zamanlar dahil). */
export type SheetActivityPeriod = 'today' | '7d' | '30d' | 'ytd' | 'all'

export function mapStatsPeriodToSheet(period: PulsePeriod): SheetActivityPeriod {
  if (period === 'today') return 'today'
  if (period === '7d') return '7d'
  if (period === 'ytd') return 'ytd'
  if (period === 'all') return 'all'
  return '30d'
}

export type PeriodLearningSummary = {
  trainingReads: number
  objectionReads: number
}

export type FieldEngagementSummary = {
  newCandidates: number
  calls: number
  whatsapps: number
  presentationsSent: number
  appointmentsSet: number
  appointmentsDone: number
}

export type LearningProgressSummary = {
  trainingRead: number
  trainingPct: number
  trainingFav: number
  objectionRead: number
  objectionPct: number
  objectionFav: number
}

export function periodStartIso(period: PulsePeriod): string | null {
  if (period === 'all') return null
  const today = todayCalendarKey() // İstanbul (UTC+3) bugünü
  if (period === 'today') return istanbulDayStartIso(today)
  if (period === 'ytd') return istanbulDayStartIso(`${today.slice(0, 4)}-01-01`)
  const days = period === '7d' ? 7 : 30
  const start = fromCalendarKey(today)
  start.setDate(start.getDate() - days)
  return istanbulDayStartIso(toCalendarKey(start))
}

const LEARNING_STREAK_EVENT_TYPES = ['training_read', 'objection_read'] as const

/** Ardışık takvim günü serisi (İstanbul; bugün dahil; bugün yoksa dünden başlar).
 *  Verilen `dayKeys` İstanbul gün anahtarı (istanbulDayKey) olmalı. */
export function computeConsecutiveDayStreak(dayKeys: Iterable<string>): number {
  const set = dayKeys instanceof Set ? dayKeys : new Set(dayKeys)
  if (set.size === 0) return 0

  const cursor = fromCalendarKey(todayCalendarKey())
  if (!set.has(toCalendarKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  let streak = 0
  while (set.has(toCalendarKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeFieldStreak(
  actions: { action_type: string; created_at: string }[],
  windowDays = 7
): number {
  const fieldTypes = new Set(['call', 'whatsapp', 'stage_change', 'note', 'ai_generate'])
  const dayKeys = new Set<string>()
  for (const a of actions) {
    if (fieldTypes.has(a.action_type)) {
      dayKeys.add(istanbulDayKey(a.created_at))
    }
  }

  const cursor = fromCalendarKey(todayCalendarKey())
  let activeDays = 0
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(cursor)
    d.setDate(d.getDate() - i)
    if (dayKeys.has(toCalendarKey(d))) activeDays++
  }
  return activeDays
}

export function computeLearningStreak(
  events: { event_type: string; created_at: string }[]
): number {
  const dayKeys = new Set<string>()
  for (const e of events) {
    if (!LEARNING_STREAK_EVENT_TYPES.includes(e.event_type as (typeof LEARNING_STREAK_EVENT_TYPES)[number])) {
      continue
    }
    dayKeys.add(istanbulDayKey(e.created_at))
  }
  return computeConsecutiveDayStreak(dayKeys)
}

export function countDistinctReadsInPeriod(
  events: { event_type: string; item_key: string | null }[]
): PeriodLearningSummary {
  const training = new Set<string>()
  const objections = new Set<string>()
  for (const e of events) {
    if (!e.item_key) continue
    if (e.event_type === 'training_read') training.add(e.item_key)
    if (e.event_type === 'objection_read') objections.add(e.item_key)
  }
  return {
    trainingReads: training.size,
    objectionReads: objections.size,
  }
}

export function parseLearningProgress(row: {
  read_trainings?: unknown
  fav_trainings?: unknown
  read_objections?: unknown
  fav_objections?: unknown
} | null): LearningProgressSummary {
  const readTrainings = Array.isArray(row?.read_trainings)
    ? (row!.read_trainings as string[])
    : []
  const favTrainings = Array.isArray(row?.fav_trainings)
    ? (row!.fav_trainings as string[])
    : []
  const readObjections = Array.isArray(row?.read_objections)
    ? (row!.read_objections as number[])
    : []
  const favObjections = Array.isArray(row?.fav_objections)
    ? (row!.fav_objections as number[])
    : []

  const trainingRead = readTrainings.length
  const objectionRead = readObjections.length

  return {
    trainingRead,
    trainingPct: Math.min(
      100,
      Math.round((trainingRead / CANONICAL_TRAINING_COUNT) * 100)
    ),
    trainingFav: favTrainings.length,
    objectionRead,
    objectionPct: Math.min(
      100,
      Math.round((objectionRead / CANONICAL_OBJECTION_COUNT) * 100)
    ),
    objectionFav: favObjections.length,
  }
}

export type PulseAttentionFlag =
  | 'inactive'
  | 'low_training'
  | 'objections_gap'

/** Nabız verisi yok veya sorgu hata verdiğinde UI sıfır gösterir. */
export function emptyMyPulseSummary(period: PulsePeriod): {
  learning: LearningProgressSummary
  periodLearning: PeriodLearningSummary | null
  onboardingDone: number
  field: FieldEngagementSummary
  streakDays: number
  video: VideoProgressSummary
  videoDropoff: number
} {
  const video = summarizeVideoProgress(
    TRAINING_VIDEOS.map(v => v.key),
    {}
  )
  return {
    learning: parseLearningProgress(null),
    periodLearning: period === 'all' ? null : { trainingReads: 0, objectionReads: 0 },
    onboardingDone: 0,
    field: {
      newCandidates: 0,
      calls: 0,
      whatsapps: 0,
      presentationsSent: 0,
      appointmentsSet: 0,
      appointmentsDone: 0,
    },
    streakDays: 0,
    video,
    videoDropoff: videoDropoffCount(video),
  }
}

export function computeAttentionFlags(input: {
  trainingPct: number
  objectionPct: number
  onboardingSteps: string[]
  lastActivityAt: string | null
  joinedAt: string | null
}): PulseAttentionFlag[] {
  const flags: PulseAttentionFlag[] = []
  const ref = input.lastActivityAt ?? input.joinedAt
  if (ref) {
    const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000)
    if (days >= 7) flags.push('inactive')
  }
  if (input.trainingPct < 20) flags.push('low_training')
  const hasObjectionStep = input.onboardingSteps.includes('step_objections')
  if (hasObjectionStep && input.objectionPct === 0) flags.push('objections_gap')
  return flags
}
