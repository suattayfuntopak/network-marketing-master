import { isTrialPeriodActive, TRIAL_DAYS } from '@/lib/domain/aiUsage'

export type AccountPhase = 'paid' | 'trial' | 'access_locked'

export interface AccountLifecycle {
  phase: AccountPhase
  registeredAt: Date
  /** 14 günlük ücretsiz erişim bitişi */
  freeAccessEndsAt: Date
  isAccessBlocked: boolean
}

function resolveFreeAccessEnd(
  licenseType: string,
  licenseExpiresAt: string | null | undefined,
  workspaceCreatedAt: string | null | undefined
): Date {
  const registeredAt = workspaceCreatedAt
    ? new Date(workspaceCreatedAt)
    : new Date()

  if (licenseType === 'free' && licenseExpiresAt) {
    return new Date(licenseExpiresAt)
  }

  const end = new Date(registeredAt)
  end.setDate(end.getDate() + TRIAL_DAYS)
  return end
}

/** SaaS tek dönem: 14 gün Basic kredileri, sonra plan yoksa erişim kilidi. */
export function getAccountLifecycle(params: {
  licenseType: string | null | undefined
  licenseExpiresAt?: string | null
  workspaceCreatedAt?: string | null
  isSuperAdmin?: boolean
}): AccountLifecycle {
  const licenseType = params.licenseType ?? 'free'
  const registeredAt = params.workspaceCreatedAt
    ? new Date(params.workspaceCreatedAt)
    : new Date()

  const freeAccessEndsAt = resolveFreeAccessEnd(
    licenseType,
    params.licenseExpiresAt,
    params.workspaceCreatedAt
  )

  if (params.isSuperAdmin || licenseType !== 'free') {
    return {
      phase: 'paid',
      registeredAt,
      freeAccessEndsAt,
      isAccessBlocked: false,
    }
  }

  const trialActive = isTrialPeriodActive(
    licenseType,
    params.licenseExpiresAt,
    params.workspaceCreatedAt
  )

  return {
    phase: trialActive ? 'trial' : 'access_locked',
    registeredAt,
    freeAccessEndsAt,
    isAccessBlocked: !trialActive,
  }
}
