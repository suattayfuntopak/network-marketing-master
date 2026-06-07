import { normalizeLicenseType, type LicenseTier } from '@/lib/domain/aiUsage'

export type GatedFeature =
  | 'ai_coach'
  | 'ai_field'
  | 'team_full'
  | 'team_pulse'
  | 'stats_advanced'

/** Paid Basic / Plus / Pro (not free), or super admin. */
export function isPaidLicense(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true
  return normalizeLicenseType(licenseType) !== 'free'
}

/** YZ Koçu, Saha Provası, Uyum — ücretli planda; free kullanıcıda tam kilit. */
export function hasAiCoachAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean
): boolean {
  return isPaidLicense(licenseType, isSuperAdmin)
}

/** Sayfa içi AI butonları (mesaj üret, davet metni, not özeti vb.). */
export function hasAiFieldAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean
): boolean {
  return hasAiCoachAccess(licenseType, isSuperAdmin)
}

/** Ekibim sayfasına giriş — free dahil herkes (gör + davet). */
export function hasTeamViewAccess(): boolean {
  return true
}

/** Gelişmiş istatistik / ekip performans tablosu — Plus ve Pro. */
export function hasStatsAdvancedAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true
  const tier = normalizeLicenseType(licenseType)
  return tier === 'plus' || tier === 'pro'
}

export function minPlanForFeature(feature: GatedFeature): LicenseTier | 'plus' {
  switch (feature) {
    case 'ai_coach':
    case 'ai_field':
      return 'basic'
    case 'team_full':
    case 'stats_advanced':
      return 'plus'
    case 'team_pulse':
      return 'pro'
    default:
      return 'basic'
  }
}
