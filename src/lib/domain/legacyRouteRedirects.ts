/** Eski hub / özet rotaları — proxy ve sayfa redirect'leri tek kaynak. */
export const ILGILEN_TAB_REDIRECTS: Record<string, string> = {
  journal: '/saha-ozetim?tab=daily',
  roadmap: '/hedefim',
  daily: '/saha-ozetim?tab=daily',
  weekly: '/saha-ozetim?tab=weekly',
  monthly: '/saha-ozetim?tab=monthly',
  first30: '/saha-radar',
  saharadar: '/saha-radar',
  live: '/canli-egitim',
  team: '/ekip',
}

export function resolveIlgilenRedirect(tab: string | null): string {
  if (!tab) return '/hedefim'
  return ILGILEN_TAB_REDIRECTS[tab] ?? '/hedefim'
}

const SUMMARY_TAB_BY_PATH: Record<string, string> = {
  '/bugunku-takibim': 'daily',
  '/haftalik-ozet': 'weekly',
  '/aylik-ozet': 'monthly',
}

/** Eski özet URL → /saha-ozetim?tab=…&offset=… */
export function resolveLegacySummaryRedirect(
  pathname: string,
  offset: string | null,
): string | null {
  const tab = SUMMARY_TAB_BY_PATH[pathname]
  if (!tab) return null
  const params = new URLSearchParams({ tab })
  if (offset) params.set('offset', offset)
  return `/saha-ozetim?${params.toString()}`
}
