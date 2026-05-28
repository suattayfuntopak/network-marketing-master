import { describe, it, expect } from 'vitest'
import {
  resolveCandidateFields,
  buildCandidateContentFields,
  syncLegacyNoteColumn,
} from './candidateFields'

describe('resolveCandidateFields', () => {
  it('reads typed columns when present', () => {
    const row = {
      note: 'legacy should be ignored',
      note_tr: 'Merhaba',
      note_en: 'Hello',
      avatar_url: 'https://cdn.example/a.jpg',
      warmth: 'sicak',
    }
    expect(resolveCandidateFields(row)).toEqual({
      noteTr: 'Merhaba',
      noteEn: 'Hello',
      avatarUrl: 'https://cdn.example/a.jpg',
      warmth: 'sicak',
    })
  })

  it('falls back to legacy 4-segment note when typed columns are empty', () => {
    const row = {
      note: 'TR metin ||| EN text ||| https://img/1.jpg ||| soguk',
      note_tr: null,
      note_en: null,
      avatar_url: null,
      warmth: 'ilik',
    }
    expect(resolveCandidateFields(row)).toEqual({
      noteTr: 'TR metin',
      noteEn: 'EN text',
      avatarUrl: 'https://img/1.jpg',
      warmth: 'soguk',
    })
  })
})

describe('buildCandidateContentFields', () => {
  it('writes typed columns and 2-segment legacy note only', () => {
    const payload = buildCandidateContentFields({
      noteTr: 'Türkçe',
      noteEn: 'English',
      avatarUrl: 'https://x/y.png',
      warmth: 'ilik',
    })
    expect(payload.note_tr).toBe('Türkçe')
    expect(payload.note_en).toBe('English')
    expect(payload.avatar_url).toBe('https://x/y.png')
    expect(payload.warmth).toBe('ilik')
    expect(payload.note).toBe('Türkçe ||| English')
    expect(payload.note).not.toContain('https://')
  })
})

describe('syncLegacyNoteColumn', () => {
  it('returns null when both empty', () => {
    expect(syncLegacyNoteColumn('', '')).toBeNull()
  })
})
