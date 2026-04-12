import type { ObjectionCategory } from '@/lib/academy/types'
import type { FollowUpBuckets } from '@/lib/calendar/types'
import type { MessageContact } from '@/lib/contacts/types'
import type { MessageCategory, MessageChannel, MessageTone } from '@/lib/messages/types'

type MessagePlaybookKey = 'reconnect' | 'invite' | 'decision'

export interface MessagePlaybook {
  key: MessagePlaybookKey
  count: number
  category: MessageCategory
  tone: MessageTone
  channel: MessageChannel
  objectionCategory: ObjectionCategory
  contact: MessageContact | null
}

const DECISION_STAGES = new Set(['interested', 'presenting', 'thinking'])
const INVITE_STAGES = new Set(['new', 'contacted'])

function getDaysSince(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY
  const diffMs = Date.now() - new Date(value).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export function buildMessagePlaybooks({
  contacts,
  followUpBuckets,
}: {
  contacts: MessageContact[]
  followUpBuckets?: FollowUpBuckets
}): MessagePlaybook[] {
  const sortedContacts = [...contacts].sort((a, b) => {
    if (b.warmth_score !== a.warmth_score) return b.warmth_score - a.warmth_score
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const reconnectFollowUps = [...(followUpBuckets?.overdue ?? []), ...(followUpBuckets?.today ?? [])]
  const reconnectContact = reconnectFollowUps[0]
    ? contacts.find((contact) => contact.id === reconnectFollowUps[0].contact.id) ?? null
    : null

  const invitePool = sortedContacts.filter((contact) => {
    if (!INVITE_STAGES.has(contact.stage)) return false
    if (contact.next_follow_up_at) return false
    return getDaysSince(contact.created_at) <= 14
  })

  const decisionPool = sortedContacts.filter((contact) => {
    if (!DECISION_STAGES.has(contact.stage)) return false
    return contact.warmth_score >= 60
  })

  const decisionLead = decisionPool[0] ?? null

  return [
    {
      key: 'reconnect',
      count: reconnectFollowUps.length,
      category: 'follow_up',
      tone: 'empathetic',
      channel: 'whatsapp',
      objectionCategory: 'wait',
      contact: reconnectContact,
    },
    {
      key: 'invite',
      count: invitePool.length,
      category: 'invitation',
      tone: 'curious',
      channel: 'whatsapp',
      objectionCategory: 'time',
      contact: invitePool[0] ?? null,
    },
    {
      key: 'decision',
      count: decisionPool.length,
      category: decisionLead?.stage === 'thinking' ? 'objection_handling' : 'closing',
      tone: decisionLead?.stage === 'thinking' ? 'empathetic' : 'confident',
      channel: 'whatsapp',
      objectionCategory: decisionLead?.stage === 'thinking' ? 'trust' : 'money',
      contact: decisionLead,
    },
  ]
}
