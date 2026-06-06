import type { NmmDailyAction, NmmDailyActionInsert } from '@/types/database.types'
import { formatSimpleNote, parseSimpleNote } from '@/lib/utils/noteParser'

export interface ResolvedDailyActionNote {
  noteTr: string
  noteEn: string
  /** True for system_note:* rows — display uses raw `note`, not translations. */
  isSystem: boolean
}

export type DailyActionNoteRow = {
  note: string | null
  note_tr?: string | null
  note_en?: string | null
}

export function isSystemActionNote(note: string | null | undefined): boolean {
  return !!note && note.startsWith('system_note:')
}

/** Leader/user bilingual notes: typed columns first, legacy `note` parse fallback. */
export function resolveDailyActionNote(row: DailyActionNoteRow): ResolvedDailyActionNote {
  const raw = row.note ?? ''
  if (isSystemActionNote(raw)) {
    return { noteTr: raw, noteEn: raw, isSystem: true }
  }

  const hasTyped = row.note_tr != null || row.note_en != null
  if (hasTyped) {
    return {
      noteTr: row.note_tr?.trim() ?? '',
      noteEn: row.note_en?.trim() ?? '',
      isSystem: false,
    }
  }

  const legacy = parseSimpleNote(raw)
  return {
    noteTr: legacy.tr,
    noteEn: legacy.en,
    isSystem: false,
  }
}

export function displayDailyActionNote(
  row: DailyActionNoteRow,
  lang: 'tr' | 'en'
): string {
  const resolved = resolveDailyActionNote(row)
  if (resolved.isSystem) return resolved.noteTr
  return lang === 'en'
    ? resolved.noteEn || resolved.noteTr
    : resolved.noteTr
}

export interface DailyActionNoteInput {
  noteTr: string
  noteEn?: string
}

/** Insert/update payload for a human leader note (not system_note). */
export function buildDailyActionNoteFields(
  input: DailyActionNoteInput
): Pick<NmmDailyActionInsert, 'note_tr' | 'note_en' | 'note'> {
  const noteTr = input.noteTr.trim()
  const noteEn = input.noteEn?.trim() ?? ''
  return {
    note_tr: noteTr || null,
    note_en: noteEn || null,
    note: formatSimpleNote(noteTr, noteEn || undefined),
  }
}

export function mergeDailyActionNoteUpdate(
  current: DailyActionNoteRow,
  patch: Partial<DailyActionNoteInput>
): Pick<NmmDailyActionInsert, 'note_tr' | 'note_en' | 'note'> {
  const resolved = resolveDailyActionNote(current)
  if (resolved.isSystem) {
    throw new Error('Cannot merge bilingual fields into a system action note')
  }
  return buildDailyActionNoteFields({
    noteTr: patch.noteTr !== undefined ? patch.noteTr : resolved.noteTr,
    noteEn: patch.noteEn !== undefined ? patch.noteEn : resolved.noteEn,
  })
}

/** In-memory bilingual text (e.g. AI summary response) — not persisted as a row shape. */
export function parseBilingualText(raw: string | null): { tr: string; en: string } {
  return parseSimpleNote(raw)
}

export type LeaderNoteAction = Pick<
  NmmDailyAction,
  'id' | 'note' | 'note_tr' | 'note_en' | 'created_at' | 'action_type'
>

/** WhatsApp sunum materyali gönderimi — aktivite geçmişi + YZ bağlamı. */
export const WHATSAPP_PRESENTATION_NOTE = 'whatsapp:presentation'

export function buildPresentationWhatsAppActivityFields(materialTitle: string): Pick<
  NmmDailyActionInsert,
  'note' | 'note_tr' | 'note_en'
> {
  const title = materialTitle.trim() || 'Sunum'
  return {
    note: WHATSAPP_PRESENTATION_NOTE,
    ...buildDailyActionNoteFields({
      noteTr: `WhatsApp · Sunum materyali gönderildi (${title})`,
      noteEn: `WhatsApp · Presentation material sent (${title})`,
    }),
  }
}

export function getWhatsAppActivityDisplay(
  row: DailyActionNoteRow,
  lang: 'tr' | 'en'
): string | null {
  if (row.note === WHATSAPP_PRESENTATION_NOTE) {
    return displayDailyActionNote(row, lang)
  }
  return null
}

export function isLeaderUserNote(action: {
  action_type: string
  note: string | null
  note_tr?: string | null
}): boolean {
  if (action.action_type !== 'note') return false
  if (isSystemActionNote(action.note)) return false
  return !!(action.note?.trim() || action.note_tr?.trim())
}
