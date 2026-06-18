import { describe, it, expect } from 'vitest'
import {
  TRIAL_PUSH_COPY,
  TRIAL_PUSH_KINDS,
  trialLifecyclePaymentPath,
  trialNotificationPhase,
  isTrialPushKind,
} from './trialLifecycle'

describe('trialLifecycle', () => {
  it('routes all payment CTAs to /odeme', () => {
    for (const kind of TRIAL_PUSH_KINDS) {
      expect(trialLifecyclePaymentPath(kind)).toBe('/odeme')
    }
    expect(trialLifecyclePaymentPath('trial_mid')).toBe('/odeme')
    expect(trialLifecyclePaymentPath('trial_15d')).toBe('/odeme')
  })

  it('defines push copy for every push kind', () => {
    for (const kind of TRIAL_PUSH_KINDS) {
      const copy = TRIAL_PUSH_COPY[kind]
      expect(copy.title_tr.length).toBeGreaterThan(0)
      expect(copy.title_en.length).toBeGreaterThan(0)
      expect(copy.description_tr.length).toBeGreaterThan(0)
      expect(copy.description_en.length).toBeGreaterThan(0)
    }
  })

  it('isTrialPushKind narrows lifecycle kinds', () => {
    expect(isTrialPushKind('trial_3d')).toBe(true)
    expect(isTrialPushKind('trial_mid')).toBe(false)
  })

  it('trialNotificationPhase detects ended vs active trial', () => {
    expect(trialNotificationPhase('Deneme bitti — YZ kilitlendi', null)).toBe('ended')
    expect(trialNotificationPhase(null, 'Trial ended — AI locked')).toBe('ended')
    expect(trialNotificationPhase('Denemene 3 gün kaldı', null)).toBe('trial')
  })
})
