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

/** Ekip Nabzı tablosu (öğrenme + nabız rozetleri) — yalnızca Pro; Plus kendi nabzını görür. */
export function hasTeamPulseAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true
  return (licenseType ?? 'free') === 'pro'
}
