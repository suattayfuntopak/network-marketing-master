import { normalizeLicenseType } from '@/lib/domain/aiUsage'

/** Alt ekip listesinde görünür üye üst sınırı — Pro sınırsız. */
export const DOWNLINE_LIST_CAPS = {
  basic: 25,
  plus: 100,
} as const

export type DownlineCapTier = keyof typeof DOWNLINE_LIST_CAPS

/** `null` = sınırsız (Pro veya süper admin). */
export function getDownlineListCap(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean,
): number | null {
  if (isSuperAdmin) return null
  const tier = normalizeLicenseType(licenseType)
  if (tier === 'pro') return null
  if (tier === 'plus') return DOWNLINE_LIST_CAPS.plus
  return DOWNLINE_LIST_CAPS.basic
}

/** Limit aşımında önerilecek yükseltme katmanı. */
export function downlineCapUpgradeTier(
  licenseType: string | null | undefined,
): DownlineCapTier {
  return normalizeLicenseType(licenseType) === 'plus' ? 'plus' : 'basic'
}

/** Alt ekip üyesi Doğru Başlangıç onboarding takibi — Plus ve Pro. */
export function hasDownlineOnboardingAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean,
): boolean {
  if (isSuperAdmin) return true
  const tier = normalizeLicenseType(licenseType)
  return tier === 'plus' || tier === 'pro'
}
