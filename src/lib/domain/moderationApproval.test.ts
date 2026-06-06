import { describe, expect, it, vi, beforeEach } from 'vitest'
import { enrichApprovedModerationData } from './moderationApproval'

describe('enrichApprovedModerationData', () => {
  const translate = vi.fn(async (text: string) => `EN:${text}`)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips Gemini when training EN fields already exist', async () => {
    const out = await enrichApprovedModerationData(
      'training',
      {
        baslik: 'Başlık',
        baslikEn: 'Existing title',
        ozet: 'Özet',
        ozetEn: 'Existing summary',
        kategoriBaslik: 'Kat',
        kategoriBaslikEn: 'Cat',
        maddeler: ['Madde 1'],
        maddelerEn: ['Item 1'],
      },
      translate,
    )
    expect(out.baslikEn).toBe('Existing title')
    expect(out.maddelerEn).toEqual(['Item 1'])
    expect(translate).not.toHaveBeenCalled()
  })

  it('translates only missing objection EN fields', async () => {
    const out = await enrichApprovedModerationData(
      'objection',
      {
        soru: { tr: 'Soru', en: 'Question' },
        kategori: { tr: 'Kat', en: 'Cat' },
        kisaCevap: 'Kısa',
        kisaCevapEn: 'Short',
      },
      translate,
    )
    expect((out.soru as { en: string }).en).toBe('Question')
    expect(out.kisaCevapEn).toBe('Short')
    expect(translate).toHaveBeenCalledTimes(0)
  })

  it('fills missing EN fields via translator', async () => {
    const out = await enrichApprovedModerationData(
      'training',
      { baslik: 'Başlık', ozet: 'Özet', kategoriBaslik: 'Kat', maddeler: ['M1'] },
      translate,
    )
    expect(out.baslikEn).toBe('EN:Başlık')
    expect(out.maddelerEn).toEqual(['EN:M1'])
    expect(translate).toHaveBeenCalled()
  })
})
