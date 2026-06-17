export const NMM_LANG_STORAGE_KEY = 'nmm_lang'
export const NMM_LANG_COOKIE = 'nmm_lang'

export type UiLang = 'tr' | 'en'

export function isUiLang(value: unknown): value is UiLang {
  return value === 'tr' || value === 'en'
}

export function readLangCookie(cookieHeader: string | null | undefined): UiLang | null {
  if (!cookieHeader) return null

  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [rawKey, rawValue] = part.trim().split('=')
    if (rawKey !== NMM_LANG_COOKIE) continue
    return isUiLang(rawValue) ? rawValue : null
  }

  return null
}

export function writeLangCookie(lang: UiLang): void {
  if (typeof document === 'undefined') return
  document.cookie = `${NMM_LANG_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`
}
