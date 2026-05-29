import { describe, it, expect } from 'vitest'
import { hasTeamPageAccess } from './teamAccess'

describe('hasTeamPageAccess', () => {
  it('allows plus and pro', () => {
    expect(hasTeamPageAccess('master')).toBe(true)
    expect(hasTeamPageAccess('pro')).toBe(true)
  })

  it('denies free trial and basic', () => {
    expect(hasTeamPageAccess('free')).toBe(false)
    expect(hasTeamPageAccess('leader')).toBe(false)
  })

  it('allows super admin', () => {
    expect(hasTeamPageAccess('free', true)).toBe(true)
  })
})
