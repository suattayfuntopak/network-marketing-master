import type { NmmCandidateInsert, NmmCandidateUpdate } from '@/types/database.types'
import { parseNote, formatSimpleNote } from '@/lib/utils/noteParser'

export type CandidateWarmth = 'sicak' | 'ilik' | 'soguk'

export interface ResolvedCandidateFields {
  noteTr: string
  noteEn: string
  avatarUrl: string | null
  warmth: CandidateWarmth
}

/** Minimal row shape — RPC/partial selects may omit typed columns until migration 023. */
export type CandidateRow = {
  note: string | null
  note_tr?: string | null
  note_en?: string | null
  avatar_url?: string | null
  warmth?: string | null
}

function normalizeWarmth(value: string | null | undefined): CandidateWarmth {
  if (value === 'sicak' || value === 'soguk') return value
  return 'ilik'
}

/** Read candidate note/avatar/warmth from typed columns, with legacy `note` parse fallback. */
export function resolveCandidateFields(row: CandidateRow): ResolvedCandidateFields {
  // `warmth` defaults to 'ilik' for every row — do not use it as a typed-column signal.
  const hasTyped =
    row.note_tr != null || row.note_en != null || row.avatar_url != null

  if (hasTyped) {
    return {
      noteTr: row.note_tr?.trim() ?? '',
      noteEn: row.note_en?.trim() ?? '',
      avatarUrl: row.avatar_url?.trim() || null,
      warmth: normalizeWarmth(row.warmth),
    }
  }

  // Fallback yalnızca typed kolonların boş olduğu eski satırlar için. Migration 023
  // sonrası `note` 2-segment (TR ||| EN); avatar/warmth bu satırlarda yok.
  const legacy = parseNote(row.note)
  return {
    noteTr: legacy.tr,
    noteEn: legacy.en,
    avatarUrl: null,
    warmth: 'ilik',
  }
}

/** Legacy `note` column: translation-only (`TR ||| EN`). */
export function syncLegacyNoteColumn(noteTr: string, noteEn: string): string | null {
  const tr = noteTr.trim()
  const en = noteEn.trim()
  if (!tr && !en) return null
  return formatSimpleNote(tr, en || undefined)
}

export interface CandidateContentInput {
  noteTr?: string
  noteEn?: string
  avatarUrl?: string | null
  warmth?: CandidateWarmth
}

/** Build insert/update payload for typed candidate content fields. */
export function buildCandidateContentFields(
  input: CandidateContentInput
): Pick<NmmCandidateInsert, 'note_tr' | 'note_en' | 'avatar_url' | 'warmth' | 'note'> {
  const noteTr = input.noteTr?.trim() ?? ''
  const noteEn = input.noteEn?.trim() ?? ''
  const avatarUrl = input.avatarUrl?.trim() || null
  const warmth = input.warmth ?? 'ilik'

  return {
    note_tr: noteTr || null,
    note_en: noteEn || null,
    avatar_url: avatarUrl,
    warmth,
    note: syncLegacyNoteColumn(noteTr, noteEn),
  }
}

export function mergeCandidateContentUpdate(
  current: CandidateRow,
  patch: CandidateContentInput
): NmmCandidateUpdate {
  const resolved = resolveCandidateFields(current)
  return buildCandidateContentFields({
    noteTr: patch.noteTr !== undefined ? patch.noteTr : resolved.noteTr,
    noteEn: patch.noteEn !== undefined ? patch.noteEn : resolved.noteEn,
    avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : resolved.avatarUrl,
    warmth: patch.warmth !== undefined ? patch.warmth : resolved.warmth,
  })
}
