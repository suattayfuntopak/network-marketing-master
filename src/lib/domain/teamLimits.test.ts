import { describe, expect, it } from 'vitest'
import {
  DOWNLINE_LIST_CAPS,
  downlineCapUpgradeTier,
  getDownlineListCap,
  hasDownlineOnboardingAccess,
} from './teamLimits'

describe('teamLimits', () => {
  it('basic ve free 25, plus 100, pro sınırsız', () => {
    expect(getDownlineListCap('basic')).toBe(DOWNLINE_LIST_CAPS.basic)
    expect(getDownlineListCap('free')).toBe(DOWNLINE_LIST_CAPS.basic)
    expect(getDownlineListCap('plus')).toBe(DOWNLINE_LIST_CAPS.plus)
    expect(getDownlineListCap('pro')).toBeNull()
    expect(getDownlineListCap('basic', true)).toBeNull()
  })

  it('onboarding takibi plus+', () => {
    expect(hasDownlineOnboardingAccess('basic')).toBe(false)
    expect(hasDownlineOnboardingAccess('plus')).toBe(true)
    expect(hasDownlineOnboardingAccess('pro')).toBe(true)
  })

  it('upgrade tier plus cap için pro önerir', () => {
    expect(downlineCapUpgradeTier('basic')).toBe('basic')
    expect(downlineCapUpgradeTier('plus')).toBe('plus')
  })
})
