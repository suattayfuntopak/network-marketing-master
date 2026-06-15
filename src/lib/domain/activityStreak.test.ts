import { describe, it, expect } from 'vitest'
import { computeActivityStreak } from '@/lib/domain/activityStreak'

const TODAY = '2026-06-15'

describe('computeActivityStreak', () => {
  it('boş küme → 0', () => {
    expect(computeActivityStreak([], TODAY)).toBe(0)
  })

  it('yalnız bugün → 1', () => {
    expect(computeActivityStreak(['2026-06-15'], TODAY)).toBe(1)
  })

  it('bugün + dün → 2', () => {
    expect(computeActivityStreak(['2026-06-15', '2026-06-14'], TODAY)).toBe(2)
  })

  it('kesintisiz çoklu gün → tam sayım', () => {
    const keys = ['2026-06-15', '2026-06-14', '2026-06-13', '2026-06-12']
    expect(computeActivityStreak(keys, TODAY)).toBe(4)
  })

  it('bugün henüz işlenmedi ama dün var → seri yaşıyor', () => {
    expect(computeActivityStreak(['2026-06-14', '2026-06-13'], TODAY)).toBe(2)
  })

  it('bugün de dün de yok → seri kopmuş → 0', () => {
    expect(computeActivityStreak(['2026-06-13', '2026-06-12'], TODAY)).toBe(0)
  })

  it('ortadaki boşluk seriyi keser', () => {
    // bugün + dün var, sonra 12 atlanmış → 13 sayılmaz
    const keys = ['2026-06-15', '2026-06-14', '2026-06-12']
    expect(computeActivityStreak(keys, TODAY)).toBe(2)
  })

  it('ay sınırını doğru geçer', () => {
    const keys = ['2026-06-01', '2026-05-31', '2026-05-30']
    expect(computeActivityStreak(keys, '2026-06-01')).toBe(3)
  })

  it('tekrarlı anahtarlar seriyi şişirmez', () => {
    expect(computeActivityStreak(['2026-06-15', '2026-06-15', '2026-06-14'], TODAY)).toBe(2)
  })
})
