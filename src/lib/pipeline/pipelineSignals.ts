import type { ContactWithTags } from '@/lib/contacts/types'

const ACTIVE_STAGES = new Set(['new', 'contacted', 'interested', 'presenting', 'thinking'])
const ADVANCE_STAGES = new Set(['interested', 'presenting', 'thinking'])
const OPENING_STAGES = new Set(['new', 'contacted'])

export type PipelineFocusMode = 'stabilize' | 'advance' | 'open' | 'nurture'

export interface PipelineSignalSummary {
  followUpRisk: number
  advanceWindow: number
  freshOpenings: number
  focus: PipelineFocusMode
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

export function buildPipelineSignalSummary(contacts: ContactWithTags[]): PipelineSignalSummary {
  const activeContacts = contacts.filter((contact) => ACTIVE_STAGES.has(contact.stage))

  const followUpRisk = activeContacts.filter((contact) => isDueNow(contact.next_follow_up_at)).length

  const advanceWindow = activeContacts.filter(
    (contact) => ADVANCE_STAGES.has(contact.stage) && contact.warmth_score >= 65
  ).length

  const freshOpenings = activeContacts.filter((contact) => {
    const daysSinceCreated = getDaysSince(contact.created_at)
    const daysSinceLastTouch = getDaysSince(contact.last_contact_at)

    return (
      OPENING_STAGES.has(contact.stage) &&
      daysSinceCreated <= 10 &&
      !contact.next_follow_up_at &&
      daysSinceLastTouch >= 2
    )
  }).length

  const focus: PipelineFocusMode =
    followUpRisk > 0
      ? 'stabilize'
      : advanceWindow > 0
        ? 'advance'
        : freshOpenings > 0
          ? 'open'
          : 'nurture'

  return {
    followUpRisk,
    advanceWindow,
    freshOpenings,
    focus,
  }
}
