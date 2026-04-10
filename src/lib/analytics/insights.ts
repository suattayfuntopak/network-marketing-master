import type { FollowUpBuckets } from '@/lib/calendar/types'
import type { ContactWithTags } from '@/lib/contacts/types'

type InsightTone = 'good' | 'watch' | 'risk'

export interface AnalyticsInsights {
  riskCount: number
  growthCount: number
  rhythmScore: number
  overdueFollowUps: number
  stalledWarmLeads: number
  freshProspects: number
  readyNowLeads: number
  nextMove: 'risk' | 'growth' | 'rhythm' | 'balanced'
  tones: {
    risk: InsightTone
    growth: InsightTone
    rhythm: InsightTone
  }
}

const WARM_STAGES = new Set(['interested', 'presenting', 'thinking'])
const EARLY_STAGES = new Set(['new', 'contacted'])

function getDaysSince(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY
  const diffMs = Date.now() - new Date(value).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getDaysUntil(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY
  const diffMs = new Date(value).getTime() - Date.now()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function getRiskTone(count: number): InsightTone {
  if (count >= 5) return 'risk'
  if (count >= 2) return 'watch'
  return 'good'
}

function getGrowthTone(count: number): InsightTone {
  if (count >= 4) return 'good'
  if (count >= 2) return 'watch'
  return 'risk'
}

function getRhythmTone(score: number): InsightTone {
  if (score >= 70) return 'good'
  if (score >= 45) return 'watch'
  return 'risk'
}

export function buildAnalyticsInsights(
  contacts: ContactWithTags[],
  followUpBuckets?: FollowUpBuckets
): AnalyticsInsights {
  const activeContacts = contacts.filter((contact) => contact.stage !== 'lost')

  const warmPipeline = activeContacts.filter(
    (contact) => WARM_STAGES.has(contact.stage) && contact.warmth_score >= 60
  )

  const readyNowLeads = warmPipeline.filter((contact) => {
    const daysUntilFollowUp = getDaysUntil(contact.next_follow_up_at)
    return contact.warmth_score >= 75 || daysUntilFollowUp <= 2
  }).length

  const stalledWarmLeads = warmPipeline.filter((contact) => {
    const daysSinceLastTouch = getDaysSince(contact.last_contact_at)
    const daysUntilFollowUp = getDaysUntil(contact.next_follow_up_at)
    return daysSinceLastTouch >= 5 && daysUntilFollowUp > 2
  }).length

  const freshProspects = activeContacts.filter((contact) => {
    return EARLY_STAGES.has(contact.stage) && getDaysSince(contact.created_at) <= 10
  }).length

  const coveredContacts = activeContacts.filter((contact) => {
    const hasNearFollowUp = getDaysUntil(contact.next_follow_up_at) <= 7
    const touchedRecently = getDaysSince(contact.last_contact_at) <= 7
    return hasNearFollowUp || touchedRecently
  }).length

  const overdueFollowUps = followUpBuckets?.overdue.length ?? 0
  const riskCount = overdueFollowUps + stalledWarmLeads
  const growthCount = readyNowLeads + freshProspects
  const rhythmScore = activeContacts.length > 0 ? Math.round((coveredContacts / activeContacts.length) * 100) : 0

  const tones = {
    risk: getRiskTone(riskCount),
    growth: getGrowthTone(growthCount),
    rhythm: getRhythmTone(rhythmScore),
  }

  let nextMove: AnalyticsInsights['nextMove'] = 'balanced'
  if (riskCount >= 3 || overdueFollowUps > 0) {
    nextMove = 'risk'
  } else if (growthCount >= 3) {
    nextMove = 'growth'
  } else if (rhythmScore < 50) {
    nextMove = 'rhythm'
  }

  return {
    riskCount,
    growthCount,
    rhythmScore,
    overdueFollowUps,
    stalledWarmLeads,
    freshProspects,
    readyNowLeads,
    nextMove,
    tones,
  }
}
