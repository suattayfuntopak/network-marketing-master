import { describe, it, expect } from 'vitest'
import {
  formatMonthLabel,
  formatMonthLabelCompact,
  formatWeekRangeLabel,
  formatWeekRangeLabelCompact,
  parsePeriodOffset,
} from './hubPeriodRange'

describe('hubPeriodRange labels', () => {
  const juneStart = new Date(2026, 5, 1)
  const juneEnd = new Date(2026, 5, 7)
  const crossMonthStart = new Date(2026, 4, 28)
  const crossMonthEnd = new Date(2026, 5, 3)

  it('formatWeekRangeLabelCompact aynı ay içinde kısa ay adı kullanır', () => {
    const full = formatWeekRangeLabel(juneStart, juneEnd, 'tr')
    const compact = formatWeekRangeLabelCompact(juneStart, juneEnd, 'tr')
    expect(compact).toMatch(/^1–7 /)
    expect(compact.length).toBeLessThanOrEqual(full.length)
  })

  it('formatWeekRangeLabelCompact ay geçişinde tire birleşik kalır', () => {
    const compact = formatWeekRangeLabelCompact(crossMonthStart, crossMonthEnd, 'tr')
    expect(compact).toContain('–')
    expect(compact).not.toContain(' – ')
  })

  it('formatMonthLabelCompact tam aya göre daha kısadır', () => {
    const ref = new Date(2026, 5, 15)
    const full = formatMonthLabel(ref, 'tr')
    const compact = formatMonthLabelCompact(ref, 'tr')
    expect(compact.length).toBeLessThan(full.length)
    expect(compact).toMatch(/2026/)
  })

  it('parsePeriodOffset geçersiz değerleri 0 yapar', () => {
    expect(parsePeriodOffset(null)).toBe(0)
    expect(parsePeriodOffset('')).toBe(0)
    expect(parsePeriodOffset('abc')).toBe(0)
    expect(parsePeriodOffset('2')).toBe(2)
    expect(parsePeriodOffset('-3')).toBe(-3)
  })
})
