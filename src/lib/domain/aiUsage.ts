// Günlük AI mesaj limitleri — tek kaynak, tüm server action'lar ve UI bu fonksiyonu kullanır.

export type LicenseTier = 'free' | 'leader' | 'master' | 'pro'

export interface AILimits {
  messageLimit: number
  roleplayLimit: number
  complianceLimit: number
}

export const TRIAL_DAYS = 14

const PAID_LIMITS: Record<Exclude<LicenseTier, 'free'>, AILimits> = {
  pro: { messageLimit: 100, roleplayLimit: 60, complianceLimit: 15 },
  master: { messageLimit: 40, roleplayLimit: 25, complianceLimit: 5 },
  leader: { messageLimit: 15, roleplayLimit: 10, complianceLimit: 2 },
}

const POST_TRIAL_FREE_LIMITS: AILimits = {
  messageLimit: 5,
  roleplayLimit: 3,
  complianceLimit: 0,
}

/** 14-day signup trial uses Basic (leader) daily credits while license_type stays `free`. */
export function isTrialPeriodActive(
  licenseType: string | null | undefined,
  licenseExpiresAt: string | null | undefined,
  workspaceCreatedAt?: string | null
): boolean {
  if ((licenseType ?? 'free') !== 'free') return false
  const now = Date.now()
  if (licenseExpiresAt) {
    return new Date(licenseExpiresAt).getTime() > now
  }
  if (workspaceCreatedAt) {
    const trialEnd = new Date(workspaceCreatedAt)
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)
    return trialEnd.getTime() > now
  }
  return false
}

export function getEffectiveLicenseType(
  licenseType: string | null | undefined,
  licenseExpiresAt?: string | null,
  workspaceCreatedAt?: string | null
): LicenseTier {
  const type = (licenseType ?? 'free') as LicenseTier
  if (type !== 'free') return type
  return isTrialPeriodActive(type, licenseExpiresAt, workspaceCreatedAt) ? 'leader' : 'free'
}

export function getLimitsForLicense(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean,
  licenseExpiresAt?: string | null,
  workspaceCreatedAt?: string | null
): AILimits {
  if (isSuperAdmin) {
    return {
      messageLimit: Infinity,
      roleplayLimit: Infinity,
      complianceLimit: Infinity,
    }
  }

  const effective = getEffectiveLicenseType(licenseType, licenseExpiresAt, workspaceCreatedAt)

  if (effective === 'free') {
    return POST_TRIAL_FREE_LIMITS
  }

  return PAID_LIMITS[effective]
}

export function formatCreditButtonLabel(
  actionLabel: string,
  remaining: number,
  limit: number,
  isSuperAdmin?: boolean,
  lang: 'tr' | 'en' = 'tr'
): string {
  if (isSuperAdmin || !Number.isFinite(limit)) {
    return `${actionLabel} (∞)`
  }
  const credit =
    lang === 'en'
      ? `Remaining ${remaining}/${limit}`
      : `Kalan ${remaining}/${limit}`
  return `${actionLabel} (${credit})`
}
