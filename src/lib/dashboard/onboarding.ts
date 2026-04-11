import { ROUTES } from '@/lib/constants'

export type DashboardOnboardingStepKey =
  | 'profile'
  | 'first_contact'
  | 'first_follow_up'
  | 'first_learning'

export interface DashboardOnboardingStep {
  key: DashboardOnboardingStepKey
  completed: boolean
  href: string
}

export interface DashboardOnboardingSummary {
  steps: DashboardOnboardingStep[]
  completedCount: number
  totalSteps: number
  completionPct: number
  nextStepKey: DashboardOnboardingStepKey | null
  show: boolean
}

export function buildDashboardOnboarding({
  profileName,
  contactCount,
  followUpCount,
  academyTodayCount,
}: {
  profileName?: string | null
  contactCount: number
  followUpCount: number
  academyTodayCount: number
}): DashboardOnboardingSummary {
  const steps: DashboardOnboardingStep[] = [
    {
      key: 'profile',
      completed: Boolean(profileName?.trim()),
      href: ROUTES.SETTINGS,
    },
    {
      key: 'first_contact',
      completed: contactCount > 0,
      href: `${ROUTES.CONTACTS}/yeni`,
    },
    {
      key: 'first_follow_up',
      completed: followUpCount > 0,
      href: `${ROUTES.CALENDAR}/takipler`,
    },
    {
      key: 'first_learning',
      completed: academyTodayCount > 0,
      href: ROUTES.ACADEMY,
    },
  ]

  const completedCount = steps.filter((step) => step.completed).length
  const totalSteps = steps.length
  const completionPct = Math.round((completedCount / totalSteps) * 100)
  const nextStepKey = steps.find((step) => !step.completed)?.key ?? null

  return {
    steps,
    completedCount,
    totalSteps,
    completionPct,
    nextStepKey,
    show: completedCount < totalSteps,
  }
}
