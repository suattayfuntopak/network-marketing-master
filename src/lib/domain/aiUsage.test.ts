import { describe, it, expect } from 'vitest'
import {
  formatCreditButtonLabel,
  getEffectiveLicenseType,
  getLimitsForLicense,
  isTrialPeriodActive,
} from './aiUsage'

const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
const createdRecently = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

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
      complianceLimit: 15,
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

  it('returns post-trial free limits when trial expired', () => {
    expect(getLimitsForLicense('free', false, past)).toEqual({
      messageLimit: 5,
      roleplayLimit: 3,
      complianceLimit: 0,
    })
  })

  it('returns basic trial credits while free license is in trial window', () => {
    expect(getLimitsForLicense('free', false, future)).toEqual({
      messageLimit: 15,
      roleplayLimit: 10,
      complianceLimit: 2,
    })
  })

  it('infers trial from workspace created_at when expiry not set', () => {
    expect(
      isTrialPeriodActive('free', null, createdRecently)
    ).toBe(true)
    expect(getEffectiveLicenseType('free', null, createdRecently)).toBe('leader')
    expect(getLimitsForLicense('free', false, null, createdRecently)).toEqual({
      messageLimit: 15,
      roleplayLimit: 10,
      complianceLimit: 2,
    })
  })
})

describe('formatCreditButtonLabel', () => {
  it('uses compact Turkish credit text without colon', () => {
    expect(formatCreditButtonLabel('Uyum Denetimi Yap', 2, 2, false, 'tr')).toBe(
      'Uyum Denetimi Yap (Kullanılan 2/2)'
    )
  })

  it('uses English used label when lang is en', () => {
    expect(formatCreditButtonLabel('Generate', 5, 15, false, 'en')).toBe(
      'Generate (Used 5/15)'
    )
  })

  it('shows infinity for super admin', () => {
    expect(formatCreditButtonLabel('Üret', 99, 15, true, 'tr')).toBe('Üret (∞)')
  })
})
