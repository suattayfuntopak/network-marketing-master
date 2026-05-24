export interface ParsedNote {
  tr: string
  en: string
  avatarUrl: string
}

export function parseNote(rawNote: string | null): ParsedNote {
  const result = { tr: '', en: '', avatarUrl: '' }
  if (!rawNote) return result
  const parts = rawNote.split('|||')
  result.tr = parts[0]?.trim() ?? ''
  result.en = parts[1]?.trim() ?? ''
  result.avatarUrl = parts[2]?.trim() ?? ''
  return result
}

export function formatNote(tr: string, en?: string, avatarUrl?: string): string {
  const parts = [
    tr.trim(),
    (en ?? '').trim(),
    (avatarUrl ?? '').trim()
  ]
  
  // Trim trailing empty parts to keep data footprint compact
  while (parts.length > 0 && !parts[parts.length - 1]) {
    parts.pop()
  }
  
  return parts.join(' ||| ')
}
