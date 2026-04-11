import type { ContactWithTags } from './types'

const ACTIVE_STAGES = new Set(['new', 'contacted', 'interested', 'presenting', 'thinking'])
const WARM_WINDOW_STAGES = new Set(['interested', 'presenting', 'thinking'])
const EARLY_STAGES = new Set(['new', 'contacted'])

export type ContactInsightFocus = 'stabilize' | 'advance' | 'reactivate' | 'build'

export interface ContactInsightSummary {
  dueNow: number
  warmWindow: number
  reactivationPool: number
  freshProspects: number
  focus: ContactInsightFocus
}

function getDaysSince(dateValue: string | null) {
  if (!dateValue) return Number.POSITIVE_INFINITY
  const diffMs = Date.now() - new Date(dateValue).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function isDueNow(dateValue: string | null) {
  if (!dateValue) return false
  return new Date(dateValue).getTime() <= Date.now()
}

export function buildContactInsightSummary(contacts: ContactWithTags[]): ContactInsightSummary {
  const activeContacts = contacts.filter((contact) => ACTIVE_STAGES.has(contact.stage))

  const dueNow = activeContacts.filter((contact) => isDueNow(contact.next_follow_up_at)).length

  const warmWindow = activeContacts.filter(
    (contact) => WARM_WINDOW_STAGES.has(contact.stage) && contact.warmth_score >= 65
  ).length

  const reactivationPool = activeContacts.filter((contact) => {
    const daysSinceCreated = getDaysSince(contact.created_at)
    const daysSinceLastTouch = getDaysSince(contact.last_contact_at)

    return daysSinceCreated >= 7 && daysSinceLastTouch >= 7 && !isDueNow(contact.next_follow_up_at)
  }).length

  const freshProspects = activeContacts.filter((contact) => {
    const daysSinceCreated = getDaysSince(contact.created_at)
    return EARLY_STAGES.has(contact.stage) && daysSinceCreated <= 10
  }).length

  const focus: ContactInsightFocus =
    dueNow > 0
      ? 'stabilize'
      : warmWindow > 0
        ? 'advance'
        : reactivationPool > 0
          ? 'reactivate'
          : 'build'

  return {
    dueNow,
    warmWindow,
    reactivationPool,
    freshProspects,
    focus,
  }
}
