import { describe, it, expect } from 'vitest'
import {
  toCalendarKey,
  fromCalendarKey,
  keysForDaysAfter,
  followUpToIsoFromKey,
  istanbulDayStartIso,
  istanbulDayKey,
} from './calendarDates'

describe('calendarDates', () => {
  it('toCalendarKey yerel tarihi YYYY-MM-DD üretir (UTC kayması yok)', () => {
    // Yerel öğlen — timezone ne olursa olsun aynı takvim günü.
    expect(toCalendarKey(new Date(2026, 4, 31, 12, 0, 0))).toBe('2026-05-31')
    expect(toCalendarKey(new Date(2026, 0, 1, 12, 0, 0))).toBe('2026-01-01')
  })

  it('fromCalendarKey ↔ toCalendarKey round-trip korunur', () => {
    for (const key of ['2026-05-31', '2026-12-01', '2027-02-28']) {
      expect(toCalendarKey(fromCalendarKey(key))).toBe(key)
    }
  })

  it('keysForDaysAfter sıralı sonraki günleri verir, ay sınırını aşar', () => {
    expect(keysForDaysAfter('2026-05-30', 3)).toEqual([
      '2026-05-31',
      '2026-06-01',
      '2026-06-02',
    ])
  })

  it('istanbulDayStartIso İstanbul gün başını UTC ISO olarak verir (UTC+3)', () => {
    // 00:00 +03:00 = önceki günün 21:00 UTC'si.
    expect(istanbulDayStartIso('2026-05-31')).toBe('2026-05-30T21:00:00.000Z')
    expect(istanbulDayStartIso('2026-01-01')).toBe('2025-12-31T21:00:00.000Z')
  })

  it('followUpToIsoFromKey yerel öğleni ISO olarak döndürür', () => {
    // 12:00 yerel saat — round-trip ile aynı takvim gününe çözülmeli.
    const iso = followUpToIsoFromKey('2026-05-31')
    expect(toCalendarKey(new Date(iso))).toBe('2026-05-31')
  })

  it('istanbulDayKey gece yarısı–03:00 penceresini DOĞRU güne yazar (UTC değil)', () => {
    // 01:00 İstanbul 12 Haz = 22:00 UTC 11 Haz. UTC slice yanlış '06-11' verirdi;
    // İstanbul günü doğru '06-12' olmalı (gece yarısı rollover regresyonu).
    expect(istanbulDayKey('2026-06-11T22:00:00.000Z')).toBe('2026-06-12')
    expect(istanbulDayKey('2026-06-11T23:30:00.000Z')).toBe('2026-06-12')
    // 21:00 UTC = 00:00 İstanbul ertesi gün (tam gün başı).
    expect(istanbulDayKey('2026-06-11T21:00:00.000Z')).toBe('2026-06-12')
    // 20:59 UTC = 23:59 İstanbul aynı gün.
    expect(istanbulDayKey('2026-06-11T20:59:00.000Z')).toBe('2026-06-11')
  })
})
