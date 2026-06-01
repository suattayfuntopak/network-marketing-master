/** Canonical content counts (F1 — static library sizes). */
export const CANONICAL_TRAINING_COUNT = 30
export const CANONICAL_OBJECTION_COUNT = 34
export const ONBOARDING_STEP_COUNT = 9

export type PulsePeriod = '7d' | '30d' | 'all'

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
  const days = period === '7d' ? 7 : 30
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
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
