import { describe, expect, it } from 'vitest'
import {
  defaultRejectReason,
  rejectReasonForEmail,
  toBilingualRejectReason,
} from './moderationDefaults'

describe('moderationDefaults', () => {
  it('defaultRejectReason returns single language slice', () => {
    expect(defaultRejectReason('tr')).toContain('platform rehber')
    expect(defaultRejectReason('en')).toContain('platform guidelines')
  })

  it('toBilingualRejectReason wraps custom admin text', () => {
    const out = toBilingualRejectReason('Özel gerekçe', 'tr')
    expect(out).toContain('|||')
    expect(out).toContain('Özel gerekçe')
  })

  it('rejectReasonForEmail picks recipient language', () => {
    const bilingual = toBilingualRejectReason('TR metin', 'tr')
    expect(rejectReasonForEmail(bilingual, 'en').length).toBeGreaterThan(0)
  })
})
