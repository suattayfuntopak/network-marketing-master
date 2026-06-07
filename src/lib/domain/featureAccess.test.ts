import { describe, it, expect } from 'vitest'
import {
  hasAiCoachAccess,
  hasAiFieldAccess,
  hasStatsAdvancedAccess,
  isPaidLicense,
} from './featureAccess'

describe('featureAccess', () => {
  it('free license is not paid', () => {
    expect(isPaidLicense('free')).toBe(false)
    expect(hasAiCoachAccess('free')).toBe(false)
    expect(hasAiFieldAccess('free')).toBe(false)
  })

  it('basic and above unlock AI', () => {
    expect(hasAiCoachAccess('basic')).toBe(true)
    expect(hasAiCoachAccess('leader')).toBe(true)
    expect(hasAiFieldAccess('plus')).toBe(true)
  })

  it('stats advanced requires plus or pro', () => {
    expect(hasStatsAdvancedAccess('basic')).toBe(false)
    expect(hasStatsAdvancedAccess('plus')).toBe(true)
    expect(hasStatsAdvancedAccess('pro')).toBe(true)
  })

  it('super admin bypasses all gates', () => {
    expect(hasAiCoachAccess('free', true)).toBe(true)
    expect(hasStatsAdvancedAccess('free', true)).toBe(true)
  })
})
