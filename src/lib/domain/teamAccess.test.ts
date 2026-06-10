import { describe, it, expect } from 'vitest'
import { hasTeamPageAccess } from './teamAccess'

describe('hasTeamPageAccess', () => {
  it('allows plus and pro', () => {
    expect(hasTeamPageAccess('master')).toBe(true)
    expect(hasTeamPageAccess('pro')).toBe(true)
  })

  it('allows all license tiers (freemium — ekip sayfaları açık)', () => {
    expect(hasTeamPageAccess('free')).toBe(true)
    expect(hasTeamPageAccess('leader')).toBe(true)
    expect(hasTeamPageAccess('basic')).toBe(true)
  })

  it('allows super admin', () => {
    expect(hasTeamPageAccess('free', true)).toBe(true)
  })
})
