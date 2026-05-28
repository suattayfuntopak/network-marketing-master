/**
 * Lightweight language reader for non-React contexts (hooks, utilities).
 * Reads from localStorage directly — mirrors LanguageProvider's storage key.
 */
export function getLang(): 'tr' | 'en' {
  if (typeof window === 'undefined') return 'tr'
  return (localStorage.getItem('nmm_lang') as 'tr' | 'en') || 'tr'
}
