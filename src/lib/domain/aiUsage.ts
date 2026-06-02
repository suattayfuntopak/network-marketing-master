// Günlük AI mesaj limitleri — tek kaynak, tüm server action'lar ve UI bu fonksiyonu kullanır.

export type LicenseTier = 'free' | 'basic' | 'plus' | 'pro'

export interface AILimits {
  messageLimit: number
  roleplayLimit: number
  complianceLimit: number
}

export const TRIAL_DAYS = 14

const PAID_LIMITS: Record<Exclude<LicenseTier, 'free'>, AILimits> = {
  pro: { messageLimit: 100, roleplayLimit: 60, complianceLimit: 15 },
  plus: { messageLimit: 40, roleplayLimit: 25, complianceLimit: 5 },
  basic: { messageLimit: 15, roleplayLimit: 10, complianceLimit: 2 },
}

/**
 * DB'deki license_type değerini kanonik forma indirger. Eski (legacy) değerler
 * leader→basic, master→plus ile eşlenir; basic/plus/pro/free aynen geçer. Bu,
 * 028 migration'ı ile deploy'un sırasını önemsizleştirir (kimse boşta kalmaz).
 */
export function normalizeLicenseType(raw: string | null | undefined): LicenseTier {
  switch (raw) {
    case 'basic':
    case 'leader':
      return 'basic'
    case 'plus':
    case 'master':
      return 'plus'
    case 'pro':
      return 'pro'
    default:
      return 'free'
  }
}

const POST_TRIAL_FREE_LIMITS: AILimits = {
  messageLimit: 5,
  roleplayLimit: 3,
  complianceLimit: 0,
}

/** 14-day signup trial uses Basic daily credits while license_type stays `free`. */
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
  const type = normalizeLicenseType(licenseType)
  if (type !== 'free') return type
  return isTrialPeriodActive(type, licenseExpiresAt, workspaceCreatedAt) ? 'basic' : 'free'
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

export function formatAIUsageDisplay(
  used: number,
  limit: number,
  lang: 'tr' | 'en' = 'tr'
): string {
  if (!Number.isFinite(limit)) {
    return lang === 'en' ? 'Unlimited' : 'Sınırsız'
  }
  return `${used} / ${limit}`
}

export function aiUsageProgressPercent(used: number, limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

export function formatCreditButtonLabel(
  actionLabel: string,
  used: number,
  limit: number,
  isSuperAdmin?: boolean,
  lang: 'tr' | 'en' = 'tr'
): string {
  if (isSuperAdmin || !Number.isFinite(limit)) {
    return `${actionLabel} (∞)`
  }
  const credit =
    lang === 'en'
      ? `Used ${used}/${limit}`
      : `Kullanılan ${used}/${limit}`
  return `${actionLabel} (${credit})`
}
