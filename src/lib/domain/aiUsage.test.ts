import { describe, it, expect } from 'vitest'
import {
  DAILY_AI_LIMITS,
  formatCreditButtonLabel,
  formatDailyAiLimitLabel,
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
    expect(limits.dailyLimit).toBe(Infinity)
  })

  it('returns pro plan unified daily limit', () => {
    expect(getLimitsForLicense('pro')).toEqual({ dailyLimit: DAILY_AI_LIMITS.pro })
  })

  it('returns master (plus) plan unified daily limit', () => {
    expect(getLimitsForLicense('master')).toEqual({ dailyLimit: DAILY_AI_LIMITS.plus })
  })

  it('returns leader (basic) plan unified daily limit', () => {
    expect(getLimitsForLicense('leader')).toEqual({ dailyLimit: DAILY_AI_LIMITS.basic })
  })

  it('returns zero AI after trial expired on free license', () => {
    expect(getLimitsForLicense('free', false, past)).toEqual({ dailyLimit: 0 })
  })

  it('returns basic trial credits while free license is in trial window', () => {
    expect(getLimitsForLicense('free', false, future)).toEqual({
      dailyLimit: DAILY_AI_LIMITS.basic,
    })
  })

  it('infers trial from workspace created_at when expiry not set', () => {
    expect(isTrialPeriodActive('free', null, createdRecently)).toBe(true)
    expect(getEffectiveLicenseType('free', null, createdRecently)).toBe('basic')
    expect(getLimitsForLicense('free', false, null, createdRecently)).toEqual({
      dailyLimit: DAILY_AI_LIMITS.basic,
    })
  })
})

describe('formatDailyAiLimitLabel', () => {
  it('formats Turkish plan copy from DAILY_AI_LIMITS', () => {
    expect(formatDailyAiLimitLabel('basic', 'tr')).toBe(
      `Günlük ${DAILY_AI_LIMITS.basic} Yapay Zeka Mesajı`
    )
  })
})

describe('formatCreditButtonLabel', () => {
  it('uses compact Turkish credit text without colon', () => {
    expect(formatCreditButtonLabel('Uyum Denetimi Yap', 2, 20, false, 'tr')).toBe(
      'Uyum Denetimi Yap (Kullanılan 2/20)'
    )
  })

  it('uses English used label when lang is en', () => {
    expect(formatCreditButtonLabel('Generate', 5, 20, false, 'en')).toBe(
      'Generate (Used 5/20)'
    )
  })

  it('shows infinity for super admin', () => {
    expect(formatCreditButtonLabel('Üret', 99, 20, true, 'tr')).toBe('Üret (∞)')
  })
})
