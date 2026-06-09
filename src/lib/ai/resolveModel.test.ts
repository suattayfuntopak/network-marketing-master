import { describe, expect, it } from 'vitest'
import { GEMINI_FLASH, GEMINI_PRO } from '@/lib/ai/models'
import { resolveGeminiModel } from './resolveModel'

describe('resolveGeminiModel', () => {
  it('uses Flash for basic/plus/trial on deep coach', () => {
    expect(resolveGeminiModel('deep_coach', 'basic')).toBe(GEMINI_FLASH)
    expect(resolveGeminiModel('deep_coach', 'plus')).toBe(GEMINI_FLASH)
    expect(resolveGeminiModel('deep_coach', 'free')).toBe(GEMINI_FLASH)
  })

  it('uses Pro only for pro license deep coach', () => {
    expect(resolveGeminiModel('deep_coach', 'pro')).toBe(GEMINI_PRO)
  })

  it('always uses Flash for standard tier', () => {
    expect(resolveGeminiModel('standard', 'pro')).toBe(GEMINI_FLASH)
    expect(resolveGeminiModel('standard', 'basic')).toBe(GEMINI_FLASH)
  })
})
