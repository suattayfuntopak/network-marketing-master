import type { ContactWithTags } from '@/lib/contacts/types'

export type TeamRadarStatus = 'active' | 'slowing_down' | 'needs_support' | 'gaining_momentum'

export interface TeamRadarInsight {
  contact: ContactWithTags
  status: TeamRadarStatus
  daysSinceLastActivity: number
  focusKey: 'followUpDiscipline' | 'newConversations' | 'presentationSupport' | 'decisionSupport'
  leaderSuggestionKey: 'praiseAndExpand' | 'lightCheckIn' | 'defineNextStep' | 'resetWithOneGoal'
  momentumKey: 'building' | 'stable' | 'fragile' | 'recovery'
}

function getDaysSince(dateValue: string | null) {
  if (!dateValue) return Number.POSITIVE_INFINITY
  const diffMs = Date.now() - new Date(dateValue).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export function getTeamRadarStatus(contact: ContactWithTags): TeamRadarStatus {
  const daysSinceLastActivity = getDaysSince(contact.last_contact_at)
  const hasOverdueFollowUp =
    typeof contact.next_follow_up_at === 'string' && new Date(contact.next_follow_up_at).getTime() < Date.now()

  if (
    contact.warmth_score >= 80 &&
    daysSinceLastActivity <= 1 &&
    (contact.stage === 'interested' || contact.stage === 'presenting' || contact.stage === 'thinking')
  ) {
    return 'gaining_momentum'
  }

  if (hasOverdueFollowUp || daysSinceLastActivity >= 10) {
    return 'needs_support'
  }

  if (
    daysSinceLastActivity >= 4 ||
    contact.stage === 'thinking' ||
    (contact.warmth_score < 55 && daysSinceLastActivity >= 2)
  ) {
    return 'slowing_down'
  }

  return 'active'
}

export function buildTeamRadarInsight(contact: ContactWithTags): TeamRadarInsight {
  const status = getTeamRadarStatus(contact)
  const daysSinceLastActivity = getDaysSince(contact.last_contact_at)

  const focusKey =
    contact.stage === 'presenting'
      ? 'presentationSupport'
      : contact.stage === 'thinking'
        ? 'decisionSupport'
        : daysSinceLastActivity === Number.POSITIVE_INFINITY || contact.stage === 'new'
          ? 'newConversations'
          : 'followUpDiscipline'

  const leaderSuggestionKey =
    status === 'gaining_momentum'
      ? 'praiseAndExpand'
      : status === 'active'
        ? 'lightCheckIn'
        : status === 'slowing_down'
          ? 'defineNextStep'
          : 'resetWithOneGoal'

  const momentumKey =
    status === 'gaining_momentum'
      ? 'building'
      : status === 'active'
        ? 'stable'
        : status === 'slowing_down'
          ? 'fragile'
          : 'recovery'

  return {
    contact,
    status,
    daysSinceLastActivity,
    focusKey,
    leaderSuggestionKey,
    momentumKey,
  }
}
