/**
 * Lightweight language reader for non-React contexts (hooks, utilities).
 * Reads from localStorage directly — mirrors LanguageProvider's storage key.
 */
import {
  NMM_LANG_STORAGE_KEY,
  readLangCookie,
} from '@/lib/utils/langCookie'

export function getLang(): 'tr' | 'en' {
  if (typeof window === 'undefined') return 'tr'
  return (
    (localStorage.getItem(NMM_LANG_STORAGE_KEY) as 'tr' | 'en' | null) ??
    readLangCookie(document.cookie) ??
    'tr'
  )
}
