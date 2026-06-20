import { describe, it, expect } from 'vitest'
import { normalizeName, matchUnlinkedKatildiCandidates } from './sahaPartners'

describe('normalizeName', () => {
  it('Türkçe karakter + boşluk + noktalama düşürür', () => {
    expect(normalizeName('Ayşe Gül')).toBe('aysegul')
    expect(normalizeName('İlker Çağrı')).toBe('ilkercagri')
    expect(normalizeName(null)).toBe('')
  })
})

describe('matchUnlinkedKatildiCandidates', () => {
  const members = [{ full_name: 'Ahmet Yılmaz' }, { full_name: 'Ayşe Gül' }]

  it('yalnızca katildi adaylarını döndürür', () => {
    const candidates = [
      { id: '1', stage: 'sunum', full_name: 'Yeni Kişi' },
      { id: '2', stage: 'katildi', full_name: 'Mehmet Demir' },
    ]
    const out = matchUnlinkedKatildiCandidates(candidates, members)
    expect(out.map(c => c.id)).toEqual(['2'])
  })

  it('ekip üyesiyle isim eşleşen katildi adayını eler', () => {
    const candidates = [
      { id: '1', stage: 'katildi', full_name: 'Ahmet Yılmaz' }, // üye → elenir
      { id: '2', stage: 'katildi', full_name: 'Zeynep Kaya' },  // eşleşmez → kalır
    ]
    const out = matchUnlinkedKatildiCandidates(candidates, members)
    expect(out.map(c => c.id)).toEqual(['2'])
  })

  it('kısmi/kelime eşleşmeyi (≥3 harf) yakalar', () => {
    const candidates = [{ id: '1', stage: 'katildi', full_name: 'ahmet' }]
    expect(matchUnlinkedKatildiCandidates(candidates, members)).toHaveLength(0)
  })
})
