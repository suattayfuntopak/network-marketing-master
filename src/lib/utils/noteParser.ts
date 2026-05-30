export interface ParsedNote {
  tr: string
  en: string
}

/**
 * Legacy `note` kolonu artık yalnızca 2-segment çeviri (`TR ||| EN`) saklar.
 * Migration 023 avatar/warmth'i typed kolonlara taşıdı ve `note`'u yeniden yazdı;
 * bu fonksiyon yalnızca typed kolonların boş olduğu eski satırlar için fallback'tir.
 */
export function parseNote(rawNote: string | null): ParsedNote {
  if (!rawNote) return { tr: '', en: '' }
  const parts = rawNote.split('|||')
  return {
    tr: parts[0]?.trim() ?? '',
    en: parts[1]?.trim() ?? '',
  }
}

export interface ParsedSimpleNote {
  tr: string
  en: string
}

/** @deprecated Prefer `resolveDailyActionNote` for DB rows; still used for in-memory AI strings. */
export function parseSimpleNote(raw: string | null): ParsedSimpleNote {
  if (!raw) return { tr: '', en: '' }
  if (raw.startsWith('system_note:')) return { tr: raw, en: raw }
  const parts = raw.split('|||')
  return {
    tr: parts[0]?.trim() ?? '',
    en: parts[1]?.trim() ?? parts[0]?.trim() ?? ''
  }
}

/** @deprecated Prefer `buildDailyActionNoteFields` for DB writes. */
export function formatSimpleNote(tr: string, en?: string): string {
  if (!en || !en.trim()) return tr.trim()
  return `${tr.trim()} ||| ${en.trim()}`
}
