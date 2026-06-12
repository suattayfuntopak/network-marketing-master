import { describe, it, expect } from 'vitest'
import { buildCandidateTrendBars } from './trendBuckets'

// Sabit "now": 12 Haziran 2026, 09:00 UTC → 12:00 İstanbul (UTC+3), 12 Haziran.
const NOW = Date.UTC(2026, 5, 12, 9, 0, 0)
const at = (iso: string) => ({ created_at: iso })

describe('buildCandidateTrendBars — Tüm Zamanlar (all)', () => {
  it('iki farklı takvim ayını AYRI barlar olarak gösterir (aynı ay hatası regresyonu)', () => {
    const bars = buildCandidateTrendBars(
      [at('2026-05-20T09:00:00Z'), at('2026-06-10T09:00:00Z')],
      'all',
      NOW,
    )
    expect(bars).toEqual([
      { label: 'May 26', count: 1 },
      { label: 'Haz 26', count: 1 },
    ])
  })

  it('aday yoksa boş dizi döner', () => {
    expect(buildCandidateTrendBars([], 'all', NOW)).toEqual([])
  })

  it('18 aydan uzun aralıkta YILLIK kovalara düşer', () => {
    const bars = buildCandidateTrendBars(
      [at('2024-01-15T09:00:00Z'), at('2026-06-01T09:00:00Z')],
      'all',
      NOW,
    )
    expect(bars).toEqual([
      { label: '2024', count: 1 },
      { label: '2025', count: 0 },
      { label: '2026', count: 1 },
    ])
  })

  it('aynı aydaki birden çok adayı tek barda toplar', () => {
    const bars = buildCandidateTrendBars(
      [at('2026-06-01T09:00:00Z'), at('2026-06-09T09:00:00Z'), at('2026-06-11T09:00:00Z')],
      'all',
      NOW,
    )
    expect(bars).toHaveLength(1)
    expect(bars[0]).toEqual({ label: 'Haz 26', count: 3 })
  })
})

describe('buildCandidateTrendBars — diğer dönemler', () => {
  it('ytd: yılbaşından bu aya kadar aylık bar (Oca..Haz = 6)', () => {
    const bars = buildCandidateTrendBars(
      [at('2026-01-10T09:00:00Z'), at('2026-06-05T09:00:00Z')],
      'ytd',
      NOW,
    )
    expect(bars).toHaveLength(6)
    expect(bars[0]).toEqual({ label: 'Oca', count: 1 })
    expect(bars[5]).toEqual({ label: 'Haz', count: 1 })
  })

  it('7d: tam 7 bar döner ve bugünkü adayı sayar', () => {
    const bars = buildCandidateTrendBars([at('2026-06-12T09:00:00Z')], '7d', NOW)
    expect(bars).toHaveLength(7)
    expect(bars[6].count).toBe(1) // son bar = bugün
  })

  it('today: günü 7 dilime böler', () => {
    const bars = buildCandidateTrendBars([at('2026-06-12T08:00:00Z')], 'today', NOW)
    expect(bars).toHaveLength(7)
    expect(bars.reduce((s, b) => s + b.count, 0)).toBe(1)
  })

  it('30d: günlük barlar, bugünkü adayı son barda sayar', () => {
    const bars = buildCandidateTrendBars([at('2026-06-12T09:00:00Z')], '30d', NOW)
    expect(bars.length).toBeGreaterThan(28)
    expect(bars[bars.length - 1]).toEqual({ label: '12 Haz', count: 1 })
  })
})
