import { isTrialPeriodActive, TRIAL_DAYS } from '@/lib/domain/aiUsage'

export type AccountPhase = 'paid' | 'trial' | 'free'

export interface AccountLifecycle {
  phase: AccountPhase
  registeredAt: Date
  /** 14 günlük tanıtım dönemi bitişi (bilgilendirme; erişim kilidi yok). */
  trialEndsAt: Date
  /** @deprecated Her zaman false — free kullanıcı uygulamada kalır, özellik kilitleri ayrı yönetilir. */
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
  end.setDate(end.getDate() + TRIAL_DAYS)
  return end
}

/** Free forever: trial yalnızca bilgilendirme; uygulama geneli asla kilitlenmez. */
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

  const trialEndsAt = resolveTrialEnd(
    licenseType,
    params.licenseExpiresAt,
    params.workspaceCreatedAt
  )

  if (params.isSuperAdmin || licenseType !== 'free') {
    return {
      phase: 'paid',
      registeredAt,
      trialEndsAt,
      isAccessBlocked: false,
    }
  }

  const trialActive = isTrialPeriodActive(
    licenseType,
    params.licenseExpiresAt,
    params.workspaceCreatedAt
  )

  return {
    phase: trialActive ? 'trial' : 'free',
    registeredAt,
    trialEndsAt,
    isAccessBlocked: false,
  }
}
