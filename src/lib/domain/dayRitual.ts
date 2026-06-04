/** Client-only günlük ritüel anahtarları (DB migration yok). */

export function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dayClosedStorageKey(userId: string): string {
  return `nmm_day_closed_${userId}_${todayKey()}`
}

export function dayNoteStorageKey(userId: string): string {
  return `nmm_day_note_${userId}_${todayKey()}`
}

export function dayJournalStorageKey(userId: string): string {
  return `nmm_day_journal_${userId}_${todayKey()}`
}

export function readDayClosed(userId: string): boolean {
  try {
    return localStorage.getItem(dayClosedStorageKey(userId)) === '1'
  } catch {
    return false
  }
}

export function writeDayClosed(userId: string, note?: string): void {
  try {
    localStorage.setItem(dayClosedStorageKey(userId), '1')
    const trimmed = note?.trim()
    if (trimmed) localStorage.setItem(dayNoteStorageKey(userId), trimmed)
    else localStorage.removeItem(dayNoteStorageKey(userId))
  } catch {
    /* ignore */
  }
}

export function readDayNote(userId: string): string {
  try {
    return localStorage.getItem(dayNoteStorageKey(userId)) ?? ''
  } catch {
    return ''
  }
}

export function readDayJournal(userId: string): string {
  try {
    return localStorage.getItem(dayJournalStorageKey(userId)) ?? ''
  } catch {
    return ''
  }
}

export function writeDayJournal(userId: string, text: string): void {
  try {
    const trimmed = text.trim()
    if (trimmed) localStorage.setItem(dayJournalStorageKey(userId), trimmed)
    else localStorage.removeItem(dayJournalStorageKey(userId))
  } catch {
    /* ignore */
  }
}
