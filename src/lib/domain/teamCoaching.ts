import type { MemberRow } from '@/lib/team/types'

export type CoachingFlag = 'inactive' | 'low_onboarding'

export type CoachingAlertEntry = {
  member: MemberRow
  flag: CoachingFlag
  daysInactive: number
}

function daysSinceActivity(lastActivityAt: string | null, now = Date.now()): number {
  if (!lastActivityAt) return 999
  return Math.floor((now - new Date(lastActivityAt).getTime()) / 86_400_000)
}

/** Pano / ekip koçluk uyarıları — önce inaktif, yoksa düşük onboarding. */
export function buildCoachingAlerts(members: MemberRow[], now = Date.now()): CoachingAlertEntry[] {
  const downlines = members.filter(m => m.role === 'member')
  const inactive: CoachingAlertEntry[] = []
  const lowOnboarding: CoachingAlertEntry[] = []

  for (const m of downlines) {
    const daysInactive = daysSinceActivity(m.last_activity_at, now)
    if (daysInactive >= 7) {
      inactive.push({ member: m, flag: 'inactive', daysInactive })
    } else if ((m.onboarding_steps?.length ?? 0) < 2) {
      lowOnboarding.push({ member: m, flag: 'low_onboarding', daysInactive })
    }
  }

  inactive.sort((a, b) => b.daysInactive - a.daysInactive)
  lowOnboarding.sort((a, b) => a.daysInactive - b.daysInactive)

  return inactive.length > 0 ? inactive : lowOnboarding
}

export function coachingAlertSummary(entries: CoachingAlertEntry[]): {
  total: number
  inactiveCount: number
  lowOnboardingCount: number
} {
  const inactiveCount = entries.filter(e => e.flag === 'inactive').length
  const lowOnboardingCount = entries.filter(e => e.flag === 'low_onboarding').length
  return { total: entries.length, inactiveCount, lowOnboardingCount }
}
