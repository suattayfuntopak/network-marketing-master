/** Ekibim/saha-radar/ilk-30-gun — freemium modelde tüm planlar erişebilir; yalnızca AI butonları kilitli. */
export function hasTeamPageAccess(
  licenseType?: string | null, // eslint-disable-line @typescript-eslint/no-unused-vars
  isSuperAdmin?: boolean // eslint-disable-line @typescript-eslint/no-unused-vars
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
