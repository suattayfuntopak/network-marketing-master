import { normalizeLicenseType } from '@/lib/domain/aiUsage'

/** Ekibim (alt ekip takibi) — Plus ve Pro planlarda; Basic / ücretsiz denemede kapalı. */
export function hasTeamPageAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true
  const type = normalizeLicenseType(licenseType)
  return type === 'plus' || type === 'pro'
}

/**
 * Ekibim sayfasına "teaser" erişim — Basic dahil ücretli planlar (sayfa görünür, özellikler kilitli).
 * Free kullanıcılar /odeme'ye yönlendirilir; Basic'e sayfa gösterilir ama interaksiyon kilitlenir.
 */
export function hasTeamTeaserAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean,
  isTrialActive?: boolean
): boolean {
  if (isSuperAdmin) return true
  if (isTrialActive) return true
  const type = normalizeLicenseType(licenseType)
  return type === 'basic' || type === 'plus' || type === 'pro'
}

/** Ekip Nabzı tablosu (öğrenme + nabız rozetleri) — yalnızca Pro; Plus kendi nabzını görür. */
export function hasTeamPulseAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true
  return (licenseType ?? 'free') === 'pro'
}
