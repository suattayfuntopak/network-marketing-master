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

