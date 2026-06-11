import { describe, it, expect } from 'vitest'
import { buildInviteLink } from './inviteLink'
import { REGISTER_URL } from './constants'

describe('buildInviteLink', () => {
  it('kod yoksa düz kayıt linki döner', () => {
    expect(buildInviteLink('')).toBe(REGISTER_URL)
    expect(buildInviteLink(null)).toBe(REGISTER_URL)
    expect(buildInviteLink(undefined)).toBe(REGISTER_URL)
  })

  it('kod varsa ?ref ekler', () => {
    expect(buildInviteLink('ABC123')).toBe(`${REGISTER_URL}?ref=ABC123`)
  })

  it('kod + aday → ?ref&aday', () => {
    expect(buildInviteLink('ABC123', 'cand-1')).toBe(`${REGISTER_URL}?ref=ABC123&aday=cand-1`)
  })

  it('boş aday id eklenmez', () => {
    expect(buildInviteLink('ABC123', null)).toBe(`${REGISTER_URL}?ref=ABC123`)
    expect(buildInviteLink('ABC123', '')).toBe(`${REGISTER_URL}?ref=ABC123`)
  })

  it('kodu trim eder', () => {
    expect(buildInviteLink('  ABC  ')).toBe(`${REGISTER_URL}?ref=ABC`)
  })
})
