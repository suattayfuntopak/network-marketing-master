import { describe, it, expect } from 'vitest'
import {
  isSystemActionNote,
  resolveDailyActionNote,
  buildDailyActionNoteFields,
  displayDailyActionNote,
  isLeaderUserNote,
} from './dailyActionNote'

describe('dailyActionNote', () => {
  it('detects system notes', () => {
    expect(isSystemActionNote('system_note:warmth_change:ilik->sicak')).toBe(true)
    expect(isSystemActionNote('Merhaba')).toBe(false)
  })

  it('reads typed leader note columns', () => {
    expect(
      resolveDailyActionNote({
        note: 'ignored legacy',
        note_tr: 'Türkçe lider notu',
        note_en: 'English leader note',
      })
    ).toEqual({
      noteTr: 'Türkçe lider notu',
      noteEn: 'English leader note',
      isSystem: false,
    })
  })

  it('falls back to legacy note delimiter', () => {
    expect(
      resolveDailyActionNote({
        note: 'TR ||| EN',
        note_tr: null,
        note_en: null,
      })
    ).toMatchObject({ noteTr: 'TR', noteEn: 'EN', isSystem: false })
  })

  it('buildDailyActionNoteFields writes typed + 2-segment legacy note', () => {
    const fields = buildDailyActionNoteFields({
      noteTr: 'Türkçe',
      noteEn: 'English',
    })
    expect(fields.note_tr).toBe('Türkçe')
    expect(fields.note_en).toBe('English')
    expect(fields.note).toBe('Türkçe ||| English')
    expect(fields.note).not.toContain('system_note')
  })

  it('displayDailyActionNote respects language', () => {
    const row = { note_tr: 'Türkçe', note_en: 'English', note: 'Türkçe ||| English' }
    expect(displayDailyActionNote(row, 'tr')).toBe('Türkçe')
    expect(displayDailyActionNote(row, 'en')).toBe('English')
  })

  it('isLeaderUserNote excludes system rows', () => {
    expect(
      isLeaderUserNote({ action_type: 'note', note: 'system_note:profile_update' })
    ).toBe(false)
    expect(
      isLeaderUserNote({ action_type: 'note', note: 'Gerçek lider notu' })
    ).toBe(true)
  })
})
