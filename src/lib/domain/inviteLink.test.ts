import { describe, it, expect } from 'vitest'
import { buildInviteLink, inviteShortToken, REGISTER_ORIGIN } from './inviteLink'
import { REGISTER_URL } from './constants'

const SAMPLE_ID = '00fa3484-97b1-4683-b987-638df261b6e2'

describe('inviteShortToken', () => {
  it('uuid ilk 8 hex karakterini döner', () => {
    expect(inviteShortToken(SAMPLE_ID)).toBe('00fa3484')
  })
})

describe('buildInviteLink', () => {
  it('kod yoksa düz kayıt linki döner', () => {
    expect(buildInviteLink('')).toBe(REGISTER_URL)
    expect(buildInviteLink(null)).toBe(REGISTER_URL)
    expect(buildInviteLink(undefined)).toBe(REGISTER_URL)
  })

  it('kod varsa ?ref ekler', () => {
    expect(buildInviteLink('ABC123')).toBe(`${REGISTER_URL}?ref=ABC123`)
  })

  it('kod + aday → kısa /d/ yolu', () => {
    expect(buildInviteLink('ABC123', SAMPLE_ID)).toBe(
      `${REGISTER_ORIGIN}/d/ABC123/00fa3484`,
    )
  })

  it('boş aday id eklenmez', () => {
    expect(buildInviteLink('ABC123', null)).toBe(`${REGISTER_URL}?ref=ABC123`)
    expect(buildInviteLink('ABC123', '')).toBe(`${REGISTER_URL}?ref=ABC123`)
  })

  it('kodu trim eder', () => {
    expect(buildInviteLink('  ABC  ')).toBe(`${REGISTER_URL}?ref=ABC`)
  })
})
