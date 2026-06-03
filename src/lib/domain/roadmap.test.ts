import { describe, it, expect } from 'vitest'
import {
  computeRoadmap,
  dailyTargetsForMonth,
  currentMonthIndex,
  FUNNEL,
  WORKING_DAYS_PER_MONTH,
} from './roadmap'

describe('computeRoadmap', () => {
  it('12 ayda 650 kişi → 12 kademe, son kademe tam 650', () => {
    const r = computeRoadmap(650, 12)
    expect(r).toHaveLength(12)
    expect(r[11].teamSize).toBe(650)
    // toplam yeni üye = hedef
    expect(r.reduce((s, x) => s + x.newMembers, 0)).toBe(650)
  })

  it('duplikasyon: yeni üye sayısı aylar boyunca artar (geometrik ivme)', () => {
    const r = computeRoadmap(650, 12)
    for (let i = 1; i < r.length; i++) {
      expect(r[i].newMembers).toBeGreaterThanOrEqual(r[i - 1].newMembers)
    }
    // son ay ilk aydan belirgin büyük
    expect(r[11].newMembers).toBeGreaterThan(r[0].newMembers)
  })

  it('huni hedefleri yeni-üyeden generic oranlarla türetilir', () => {
    const r = computeRoadmap(120, 6)
    const s = r[0]
    expect(s.monthly.sunum).toBe(s.newMembers * FUNNEL.sunumPerUye)
    expect(s.monthly.tanisma).toBe(s.newMembers * FUNNEL.tanismaPerUye)
    expect(s.monthly.arama).toBe(s.newMembers * FUNNEL.aramaPerUye)
    expect(s.monthly.yeniUye).toBe(s.newMembers)
  })

  it('mevcut ekip hedefi karşılıyorsa boş döner', () => {
    expect(computeRoadmap(50, 12, 50)).toEqual([])
    expect(computeRoadmap(50, 12, 80)).toEqual([])
  })

  it('mevcut ekip kısmiyse kalan kişiyi dağıtır', () => {
    const r = computeRoadmap(100, 6, 40)
    expect(r[r.length - 1].teamSize).toBe(100)
    expect(r.reduce((s, x) => s + x.newMembers, 0)).toBe(60)
  })

  it('doğrusal oran (r=1) eşit dağıtır', () => {
    const r = computeRoadmap(120, 12, 0, 1)
    // 120/12 = 10, yuvarlama sapması son aya
    expect(r[0].newMembers).toBe(10)
    expect(r[r.length - 1].teamSize).toBe(120)
  })

  it('tek ay / 1 kişi sınır değerleri patlamaz', () => {
    expect(computeRoadmap(1, 1)).toHaveLength(1)
    expect(computeRoadmap(1, 1)[0].teamSize).toBe(1)
  })
})

describe('dailyTargetsForMonth', () => {
  it('aylık huniyi iş gününe böler (yukarı yuvarlar)', () => {
    const r = computeRoadmap(650, 12)
    const last = r[11]
    const daily = dailyTargetsForMonth(last)
    expect(daily.arama).toBe(Math.ceil(last.monthly.arama / WORKING_DAYS_PER_MONTH))
    expect(daily.arama).toBeGreaterThan(0)
  })

  it('stage yok / workingDays<=0 → sıfır hedef', () => {
    expect(dailyTargetsForMonth(undefined)).toEqual({ arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 })
    const r = computeRoadmap(100, 6)
    expect(dailyTargetsForMonth(r[0], 0)).toEqual({ arama: 0, tanisma: 0, sunum: 0, yeniUye: 0 })
  })
})

describe('currentMonthIndex', () => {
  it('başlangıç ayında 1 döner', () => {
    const start = new Date('2026-06-01T00:00:00Z')
    expect(currentMonthIndex(start, 12, new Date('2026-06-15T00:00:00Z'))).toBe(1)
  })

  it('3 ay sonra 4 döner', () => {
    const start = new Date('2026-01-10T00:00:00Z')
    expect(currentMonthIndex(start, 12, new Date('2026-04-10T00:00:00Z'))).toBe(4)
  })

  it('süre dolduysa toplam ayla sınırlanır', () => {
    const start = new Date('2025-01-01T00:00:00Z')
    expect(currentMonthIndex(start, 12, new Date('2026-12-01T00:00:00Z'))).toBe(12)
  })
})
