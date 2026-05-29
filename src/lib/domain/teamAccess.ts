/** Ekibim (alt ekip takibi) — Plus ve Pro planlarda; Basic / ücretsiz denemede kapalı. */
export function hasTeamPageAccess(
  licenseType: string | null | undefined,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true
  const type = licenseType ?? 'free'
  return type === 'master' || type === 'pro'
}
