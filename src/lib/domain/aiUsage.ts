// Günlük YZ limitleri — tek kaynak; tüm server action'lar, UI ve plan kartları buradan türetilir.

export type LicenseTier = 'free' | 'basic' | 'plus' | 'pro'

/** Plan başına günlük birleşik YZ kotası (mesaj, koç, prova, uyum — hepsi aynı havuzdan düşer). */
export const DAILY_AI_LIMITS = {
  basic: 20,
  plus: 45,
  pro: 100,
} as const

export interface AILimits {
  dailyLimit: number
}

export const TRIAL_DAYS = 14

const POST_TRIAL_FREE_LIMITS: AILimits = { dailyLimit: 0 }

function limitsForTier(tier: Exclude<LicenseTier, 'free'>): AILimits {
  return { dailyLimit: DAILY_AI_LIMITS[tier] }
}

/**
 * DB'deki license_type değerini kanonik forma indirger. Eski (legacy) değerler
 * leader→basic, master→plus ile eşlenir; basic/plus/pro/free aynen geçer.
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
    return { dailyLimit: Infinity }
  }

  const effective = getEffectiveLicenseType(licenseType, licenseExpiresAt, workspaceCreatedAt)

  if (effective === 'free') {
    return POST_TRIAL_FREE_LIMITS
  }

  return limitsForTier(effective)
}

/** Plan kartları ve ödeme sayfası için dinamik YZ limit metni. */
export function formatDailyAiLimitLabel(
  tier: Exclude<LicenseTier, 'free'>,
  lang: 'tr' | 'en' = 'tr'
): string {
  const n = DAILY_AI_LIMITS[tier]
  return lang === 'en'
    ? `Daily ${n} AI Messages`
    : `Günlük ${n} Yapay Zeka Mesajı`
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
