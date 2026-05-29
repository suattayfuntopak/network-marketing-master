import { isTrialPeriodActive } from '@/lib/domain/aiUsage'

export const POST_TRIAL_GRACE_DAYS = 30

export type AccountPhase = 'paid' | 'trial' | 'limited_free' | 'access_locked'

export interface AccountLifecycle {
  phase: AccountPhase
  registeredAt: Date
  trialEndsAt: Date
  graceEndsAt: Date
  isAccessBlocked: boolean
}

function resolveTrialEnd(
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
  end.setDate(end.getDate() + 7)
  return end
}

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

  if (params.isSuperAdmin || licenseType !== 'free') {
    const trialEndsAt = resolveTrialEnd(licenseType, params.licenseExpiresAt, params.workspaceCreatedAt)
    const graceEndsAt = new Date(trialEndsAt)
    graceEndsAt.setDate(graceEndsAt.getDate() + POST_TRIAL_GRACE_DAYS)
    return {
      phase: 'paid',
      registeredAt,
      trialEndsAt,
      graceEndsAt,
      isAccessBlocked: false,
    }
  }

  const trialEndsAt = resolveTrialEnd(
    licenseType,
    params.licenseExpiresAt,
    params.workspaceCreatedAt
  )
  const graceEndsAt = new Date(trialEndsAt)
  graceEndsAt.setDate(graceEndsAt.getDate() + POST_TRIAL_GRACE_DAYS)

  const trialActive = isTrialPeriodActive(
    licenseType,
    params.licenseExpiresAt,
    params.workspaceCreatedAt
  )
  const now = Date.now()

  let phase: AccountPhase
  if (trialActive) {
    phase = 'trial'
  } else if (now < graceEndsAt.getTime()) {
    phase = 'limited_free'
  } else {
    phase = 'access_locked'
  }

  return {
    phase,
    registeredAt,
    trialEndsAt,
    graceEndsAt,
    isAccessBlocked: phase === 'access_locked',
  }
}
