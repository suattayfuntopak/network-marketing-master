/** Ekibim/saha-radar/ilk-30-gun — freemium modelde tüm planlar erişebilir; yalnızca AI butonları kilitli. */
export function hasTeamPageAccess(
  _licenseType?: string | null,
  _isSuperAdmin?: boolean
): boolean {
  return true
}

/** Ekip Nabzı tablosu (öğrenme + nabız rozetleri) — yalnızca Pro; Plus kendi nabzını görür. */
export function hasTeamPulseAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true
  return (licenseType ?? 'free') === 'pro'
}
