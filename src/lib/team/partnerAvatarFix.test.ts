import { describe, it, expect } from 'vitest'
import {
  canonicalPartnerAvatarUrl,
  SELDA_CANDIDATE_ID,
  EZGI_CANDIDATE_ID,
  SELDA_KIRATLI_USER_ID,
  EZGI_SAGAR_USER_ID,
  SELDA_DISPLAY_AVATAR_URL,
  EZGI_DISPLAY_AVATAR_URL,
} from './partnerAvatarFix'

describe('canonicalPartnerAvatarUrl', () => {
  it('maps Selda user and candidate to Selda file URL', () => {
    expect(canonicalPartnerAvatarUrl(SELDA_KIRATLI_USER_ID, 'https://wrong/x.jpg')).toBe(
      SELDA_DISPLAY_AVATAR_URL,
    )
    expect(canonicalPartnerAvatarUrl(SELDA_CANDIDATE_ID, null)).toBe(SELDA_DISPLAY_AVATAR_URL)
    expect(SELDA_DISPLAY_AVATAR_URL).toContain('00fa3484')
  })

  it('maps Ezgi user and candidate to Ezgi file URL', () => {
    expect(canonicalPartnerAvatarUrl(EZGI_SAGAR_USER_ID, 'https://wrong/y.jpg')).toBe(
      EZGI_DISPLAY_AVATAR_URL,
    )
    expect(canonicalPartnerAvatarUrl(EZGI_CANDIDATE_ID, null)).toBe(EZGI_DISPLAY_AVATAR_URL)
    expect(EZGI_DISPLAY_AVATAR_URL).toContain('001a2b65')
  })

  it('passes through fallback for other entities', () => {
    expect(canonicalPartnerAvatarUrl('other-id', 'https://cdn.example/a.png')).toBe(
      'https://cdn.example/a.png',
    )
    expect(canonicalPartnerAvatarUrl('other-id', null)).toBeNull()
  })
})
