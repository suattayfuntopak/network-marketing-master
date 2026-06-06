import { describe, expect, it, vi, beforeEach } from 'vitest'
import { buildBilingualRejectReason } from './moderationRejectReason'

describe('buildBilingualRejectReason', () => {
  const translators = {
    translateTrToEn: vi.fn(async (text: string) => `EN:${text}`),
    translateEnToTr: vi.fn(async (text: string) => `TR:${text}`),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps TR admin text with mocked EN translation', async () => {
    const out = await buildBilingualRejectReason('Özel gerekçe', 'tr', translators)
    expect(out).toContain('|||')
    expect(out).toContain('Özel gerekçe')
    expect(out).toContain('EN:Özel gerekçe')
    expect(translators.translateTrToEn).toHaveBeenCalledWith('Özel gerekçe')
  })

  it('wraps EN admin text with mocked TR translation', async () => {
    const out = await buildBilingualRejectReason('Custom reason', 'en', translators)
    expect(out).toContain('TR:Custom reason')
    expect(out).toContain('Custom reason')
    expect(translators.translateEnToTr).toHaveBeenCalledWith('Custom reason')
  })

  it('passes through existing bilingual payload', async () => {
    const bilingual = 'Türkçe ||| English'
    const out = await buildBilingualRejectReason(bilingual, 'tr', translators)
    expect(out).toBe(bilingual)
    expect(translators.translateTrToEn).not.toHaveBeenCalled()
  })
})
