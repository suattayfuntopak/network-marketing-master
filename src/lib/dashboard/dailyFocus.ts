import type { FollowUpBuckets, FollowUpWithContact } from '@/lib/calendar/types'
import type { ContactWithTags } from '@/lib/contacts/types'

export type DailyFocusMode = 'follow_ups' | 'opportunities' | 'new_reachouts'
export type DailyFocusReason =
  | 'overdue_follow_up'
  | 'due_today'
  | 'presentation_window'
  | 'warm_opportunity'
  | 'new_contact'
  | 'fresh_touch'

export interface DailyFocusPriority {
  contactId: string
  contactName: string
  stage: string
  warmthScore: number
  mode: DailyFocusMode
  urgency: 'high' | 'medium' | 'low'
  reason: DailyFocusReason
  score: number
  city: string | null
  occupation: string | null
  followUp?: FollowUpWithContact
}

export interface DailyFocusSummary {
  recommendedMode: DailyFocusMode
  urgentFollowUps: number
  warmOpportunities: number
  newReachOuts: number
  priorities: DailyFocusPriority[]
}

const OPPORTUNITY_STAGES = new Set(['interested', 'presenting', 'thinking'])
const NEW_REACH_OUT_STAGES = new Set(['new', 'contacted'])

function getDaysSince(dateValue: string | null) {
  if (!dateValue) return Number.POSITIVE_INFINITY
  const diffMs = Date.now() - new Date(dateValue).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function getDaysUntil(dateValue: string) {
  const diffMs = new Date(dateValue).getTime() - Date.now()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function addPriority(
  map: Map<string, DailyFocusPriority>,
  nextItem: DailyFocusPriority
) {
  const current = map.get(nextItem.contactId)
  if (!current || nextItem.score > current.score) {
    map.set(nextItem.contactId, nextItem)
  }
}

export function buildDailyFocusSummary(
  contacts: ContactWithTags[],
  followUpBuckets?: FollowUpBuckets
): DailyFocusSummary {
  const priorityMap = new Map<string, DailyFocusPriority>()
  const urgentFollowUps = [...(followUpBuckets?.overdue ?? []), ...(followUpBuckets?.today ?? [])]

  urgentFollowUps.forEach((followUp) => {
    const isOverdue = getDaysUntil(followUp.due_at) < 0
    addPriority(priorityMap, {
      contactId: followUp.contact.id,
      contactName: followUp.contact.full_name,
      stage: followUp.contact.stage,
      warmthScore: 0,
      mode: 'follow_ups',
      urgency: 'high',
      reason: isOverdue ? 'overdue_follow_up' : 'due_today',
      score: isOverdue ? 120 : 108,
      city: null,
      occupation: null,
      followUp,
    })
  })

  const sortedContacts = [...contacts].sort((a, b) => {
    if (b.warmth_score !== a.warmth_score) return b.warmth_score - a.warmth_score
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  sortedContacts.forEach((contact) => {
    if (contact.stage === 'joined' || contact.stage === 'lost') return

    const daysSinceCreated = getDaysSince(contact.created_at)
    const daysSinceLastTouch = getDaysSince(contact.last_contact_at)
    const hasPendingFollowUp = typeof contact.next_follow_up_at === 'string'

    if (OPPORTUNITY_STAGES.has(contact.stage) && contact.warmth_score >= 65) {
      const reason =
        contact.stage === 'presenting' || contact.stage === 'thinking'
          ? 'presentation_window'
          : 'warm_opportunity'

      addPriority(priorityMap, {
        contactId: contact.id,
        contactName: contact.full_name,
        stage: contact.stage,
        warmthScore: contact.warmth_score,
        mode: 'opportunities',
        urgency: contact.warmth_score >= 80 ? 'high' : 'medium',
        reason,
        score: 78 + contact.warmth_score,
        city: contact.city,
        occupation: contact.occupation,
      })
      return
    }

    if (NEW_REACH_OUT_STAGES.has(contact.stage) && !hasPendingFollowUp && daysSinceCreated <= 10) {
      addPriority(priorityMap, {
        contactId: contact.id,
        contactName: contact.full_name,
        stage: contact.stage,
        warmthScore: contact.warmth_score,
        mode: 'new_reachouts',
        urgency: contact.warmth_score >= 55 ? 'medium' : 'low',
        reason: daysSinceLastTouch <= 2 ? 'fresh_touch' : 'new_contact',
        score: 44 + contact.warmth_score - daysSinceCreated,
        city: contact.city,
        occupation: contact.occupation,
      })
    }
  })

  const priorities = [...priorityMap.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  const warmOpportunities = contacts.filter(
    (contact) =>
      OPPORTUNITY_STAGES.has(contact.stage) &&
      contact.stage !== 'lost' &&
      contact.stage !== 'joined' &&
      contact.warmth_score >= 65
  ).length

  const newReachOuts = contacts.filter(
    (contact) =>
      NEW_REACH_OUT_STAGES.has(contact.stage) &&
      !contact.next_follow_up_at &&
      getDaysSince(contact.created_at) <= 10
  ).length

  const recommendedMode: DailyFocusMode =
    urgentFollowUps.length > 0
      ? 'follow_ups'
      : warmOpportunities > 0
        ? 'opportunities'
        : 'new_reachouts'

  return {
    recommendedMode,
    urgentFollowUps: urgentFollowUps.length,
    warmOpportunities,
    newReachOuts,
    priorities,
  }
}
