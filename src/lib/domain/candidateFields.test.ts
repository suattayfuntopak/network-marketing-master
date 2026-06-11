import { describe, it, expect } from 'vitest'
import {
  resolveCandidateFields,
  buildCandidateContentFields,
  syncLegacyNoteColumn,
} from './candidateFields'
import {
  SELDA_CANDIDATE_ID,
  EZGI_CANDIDATE_ID,
  SELDA_DISPLAY_AVATAR_URL,
  EZGI_DISPLAY_AVATAR_URL,
} from '@/lib/team/partnerAvatarFix'

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

  it('falls back to legacy 2-segment note (TR ||| EN) when typed columns are empty', () => {
    // Migration 023 sonrası `note` yalnızca 2-segment çeviri saklar; avatar/warmth
    // typed kolonlarda. Boş typed kolonlu eski satırlarda avatar yok, warmth varsayılan.
    const row = {
      note: 'TR metin ||| EN text',
      note_tr: null,
      note_en: null,
      avatar_url: null,
      warmth: 'ilik',
    }
    expect(resolveCandidateFields(row)).toEqual({
      noteTr: 'TR metin',
      noteEn: 'EN text',
      avatarUrl: null,
      warmth: 'ilik',
    })
  })
})

describe('resolveCandidateFields partner avatars', () => {
  it('forces canonical URLs for Selda/Ezgi candidate rows', () => {
    expect(
      resolveCandidateFields({
        id: SELDA_CANDIDATE_ID,
        note: null,
        avatar_url: 'https://wrong/selda.jpg',
      }).avatarUrl,
    ).toBe(SELDA_DISPLAY_AVATAR_URL)

    expect(
      resolveCandidateFields({
        id: EZGI_CANDIDATE_ID,
        note: null,
        avatar_url: 'https://wrong/ezgi.jpg',
      }).avatarUrl,
    ).toBe(EZGI_DISPLAY_AVATAR_URL)
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
