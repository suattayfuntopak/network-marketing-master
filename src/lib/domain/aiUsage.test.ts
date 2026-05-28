import { describe, it, expect } from 'vitest'
import { getLimitsForLicense } from './aiUsage'

describe('getLimitsForLicense', () => {
  it('grants unlimited quota to super admin regardless of license', () => {
    const limits = getLimitsForLicense('free', true)
    expect(limits.messageLimit).toBe(Infinity)
    expect(limits.roleplayLimit).toBe(Infinity)
    expect(limits.complianceLimit).toBe(Infinity)
  })

  it('returns pro plan limits', () => {
    expect(getLimitsForLicense('pro')).toEqual({
      messageLimit: 100,
      roleplayLimit: 60,
      complianceLimit: 20,
    })
  })

  it('returns master (plus) plan limits', () => {
    expect(getLimitsForLicense('master')).toEqual({
      messageLimit: 40,
      roleplayLimit: 25,
      complianceLimit: 5,
    })
  })

  it('returns leader (basic) plan limits', () => {
    expect(getLimitsForLicense('leader')).toEqual({
      messageLimit: 15,
      roleplayLimit: 10,
      complianceLimit: 2,
    })
  })

  it('returns free plan limits with compliance gated to 0', () => {
    expect(getLimitsForLicense('free')).toEqual({
      messageLimit: 5,
      roleplayLimit: 3,
      complianceLimit: 0,
    })
  })

  it('falls back to free limits for unknown / null / undefined license', () => {
    const free = { messageLimit: 5, roleplayLimit: 3, complianceLimit: 0 }
    expect(getLimitsForLicense('garbage')).toEqual(free)
    expect(getLimitsForLicense(null)).toEqual(free)
    expect(getLimitsForLicense(undefined)).toEqual(free)
  })
})
