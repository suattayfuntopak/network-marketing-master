import type { FollowUpBuckets } from '@/lib/calendar/types'

type InsightTone = 'good' | 'watch' | 'risk'

export interface FollowUpInsights {
  overdue: number
  dueToday: number
  dueTomorrow: number
  upcomingWeek: number
  completed: number
  touchCoverage: number
  nextMove: 'stabilize' | 'deliver' | 'prepare' | 'steady'
  tones: {
    stabilize: InsightTone
    deliver: InsightTone
    prepare: InsightTone
  }
}

function getTone(value: number, riskAt: number, watchAt: number): InsightTone {
  if (value >= riskAt) return 'risk'
  if (value >= watchAt) return 'watch'
  return 'good'
}

export function buildFollowUpInsights(buckets?: FollowUpBuckets): FollowUpInsights {
  const overdue = buckets?.overdue.length ?? 0
  const dueToday = buckets?.today.length ?? 0
  const dueTomorrow = buckets?.tomorrow.length ?? 0
  const thisWeek = buckets?.thisWeek.length ?? 0
  const completed = buckets?.completed.length ?? 0
  const allPending = buckets?.all.filter((item) => item.status !== 'completed') ?? []

  const touchedContactIds = new Set(allPending.map((item) => item.contact.id))
  const touchCoverage = allPending.length > 0
    ? Math.round((touchedContactIds.size / allPending.length) * 100)
    : 100

  const upcomingWeek = Math.max(0, thisWeek - dueToday - dueTomorrow)

  let nextMove: FollowUpInsights['nextMove'] = 'steady'
  if (overdue > 0) {
    nextMove = 'stabilize'
  } else if (dueToday >= 3) {
    nextMove = 'deliver'
  } else if (dueTomorrow + upcomingWeek >= 4) {
    nextMove = 'prepare'
  }

  return {
    overdue,
    dueToday,
    dueTomorrow,
    upcomingWeek,
    completed,
    touchCoverage,
    nextMove,
    tones: {
      stabilize: getTone(overdue, 3, 1),
      deliver: getTone(dueToday, 5, 2),
      prepare: getTone(dueTomorrow + upcomingWeek, 6, 3),
    },
  }
}
