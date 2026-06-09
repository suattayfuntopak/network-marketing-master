import { describe, expect, it } from 'vitest'
import {
  AI_USER_INPUT_MAX_CHARS,
  clampAIUserInput,
  rejectIfAIInputTooLong,
  trimAggregateContext,
} from './aiInputLimit'

describe('aiInputLimit', () => {
  it('clamps overlong input', () => {
    const long = 'a'.repeat(AI_USER_INPUT_MAX_CHARS + 10)
    expect(clampAIUserInput(long).length).toBe(AI_USER_INPUT_MAX_CHARS)
  })

  it('rejects overlong input with localized message', () => {
    expect(rejectIfAIInputTooLong('ok', 'tr')).toBeNull()
    expect(rejectIfAIInputTooLong('x'.repeat(1501), 'tr')).toContain('1500')
  })

  it('trims aggregate context from the end', () => {
    const text = 'x'.repeat(7000)
    const trimmed = trimAggregateContext(text, 6000)
    expect(trimmed.length).toBeLessThanOrEqual(6002)
    expect(trimmed.endsWith('x')).toBe(true)
  })
})
