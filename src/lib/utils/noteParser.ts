export interface ParsedNote {
  tr: string
  en: string
  avatarUrl: string
  warmth: 'sicak' | 'ilik' | 'soguk'
}

export function parseNote(rawNote: string | null): ParsedNote {
  const result: ParsedNote = { tr: '', en: '', avatarUrl: '', warmth: 'ilik' }
  if (!rawNote) return result
  const parts = rawNote.split('|||')
  result.tr = parts[0]?.trim() ?? ''
  result.en = parts[1]?.trim() ?? ''
  result.avatarUrl = parts[2]?.trim() ?? ''
  
  const w = parts[3]?.trim()
  if (w === 'sicak' || w === 'ilik' || w === 'soguk') {
    result.warmth = w
  }
  return result
}

/** @deprecated Use `buildCandidateContentFields` — stores avatar/warmth in typed DB columns. */
export function formatNote(tr: string, en?: string, avatarUrl?: string, warmth?: 'sicak' | 'ilik' | 'soguk'): string {
  const parts = [
    tr.trim(),
    (en ?? '').trim(),
    (avatarUrl ?? '').trim(),
    (warmth ?? 'ilik').trim()
  ]
  
  // Trim trailing empty parts to keep data footprint compact
  while (parts.length > 0 && !parts[parts.length - 1]) {
    parts.pop()
  }
  
  return parts.join(' ||| ')
}

export interface ParsedSimpleNote {
  tr: string
  en: string
}

export function parseSimpleNote(raw: string | null): ParsedSimpleNote {
  if (!raw) return { tr: '', en: '' }
  if (raw.startsWith('system_note:')) return { tr: raw, en: raw }
  const parts = raw.split('|||')
  return {
    tr: parts[0]?.trim() ?? '',
    en: parts[1]?.trim() ?? parts[0]?.trim() ?? ''
  }
}

export function formatSimpleNote(tr: string, en?: string): string {
  if (!en || !en.trim()) return tr.trim()
  return `${tr.trim()} ||| ${en.trim()}`
}
