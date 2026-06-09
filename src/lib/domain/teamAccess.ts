import { normalizeLicenseType } from '@/lib/domain/aiUsage'

/** Ekibim/saha-radar/ilk-30-gun — freemium modelde tüm planlar erişebilir; yalnızca AI butonları kilitli. */
export function hasTeamPageAccess(
  licenseType?: string | null, // eslint-disable-line @typescript-eslint/no-unused-vars
  isSuperAdmin?: boolean // eslint-disable-line @typescript-eslint/no-unused-vars
): boolean {
  return true
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
