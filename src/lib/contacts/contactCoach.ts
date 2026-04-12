import type { ObjectionCategory } from '@/lib/academy/types'
import type { Contact, ProcessContact } from '@/lib/contacts/types'
import type { MessageCategory, MessageTone } from '@/lib/messages/types'

export type ContactCoachCueKey = 'follow_up' | 'invite' | 'decision' | 'objection' | 'onboarding'

export interface ContactCoachCue {
  key: ContactCoachCueKey
  messageCategory: MessageCategory
  tone: MessageTone
  objectionCategory: ObjectionCategory
}

type ContactCoachInput = Pick<
  Contact,
  'stage' | 'contact_type' | 'warmth_score' | 'next_follow_up_at' | 'last_contact_at'
> | Pick<
  ProcessContact,
  'stage' | 'contact_type' | 'warmth_score' | 'next_follow_up_at' | 'last_contact_at'
>

function getDaysUntil(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY
  const diffMs = new Date(value).getTime() - Date.now()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function getDaysSince(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY
  const diffMs = Date.now() - new Date(value).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export function buildContactCoachCue(contact: ContactCoachInput): ContactCoachCue {
  const daysUntilFollowUp = getDaysUntil(contact.next_follow_up_at)
  const daysSinceLastTouch = getDaysSince(contact.last_contact_at)

  if (contact.stage === 'joined' || contact.contact_type === 'distributor') {
    return {
      key: 'onboarding',
      messageCategory: 'onboarding',
      tone: 'friendly',
      objectionCategory: 'fear',
    }
  }

  if (contact.stage === 'thinking') {
    return {
      key: 'objection',
      messageCategory: 'objection_handling',
      tone: 'empathetic',
      objectionCategory: 'trust',
    }
  }

  if (contact.stage === 'presenting' || contact.stage === 'interested') {
    return {
      key: 'decision',
      messageCategory: 'closing',
      tone: contact.warmth_score >= 75 ? 'confident' : 'empathetic',
      objectionCategory: 'money',
    }
  }

  if (Number.isFinite(daysUntilFollowUp) && daysUntilFollowUp <= 1) {
    return {
      key: 'follow_up',
      messageCategory: 'follow_up',
      tone: 'empathetic',
      objectionCategory: 'wait',
    }
  }

  if (contact.stage === 'contacted' || daysSinceLastTouch >= 4) {
    return {
      key: 'follow_up',
      messageCategory: 'follow_up',
      tone: 'friendly',
      objectionCategory: 'time',
    }
  }

  return {
    key: 'invite',
    messageCategory: contact.stage === 'new' ? 'first_contact' : 'invitation',
    tone: 'curious',
    objectionCategory: 'time',
  }
}
