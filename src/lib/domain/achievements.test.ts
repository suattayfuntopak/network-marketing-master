import { describe, it, expect } from 'vitest'
import { computeAchievements } from '@/lib/domain/achievements'

describe('computeAchievements', () => {
  it('sıfır girdi → hiçbir rozet kazanılmaz, next en düşük eşik', () => {
    const r = computeAchievements({ streak: 0, candidateCount: 0, teamSize: 0 })
    expect(r.earnedCount).toBe(0)
    expect(r.topEarned).toBeNull()
    // candidates_1 / team_1 eşiği 1, kalan 1 → en yakın kilitlerden biri
    expect(r.next?.threshold).toBe(1)
  })

  it('eşiği geçen metrik rozeti kazandırır', () => {
    const r = computeAchievements({ streak: 7, candidateCount: 0, teamSize: 0 })
    const earnedIds = r.achievements.filter(a => a.earned).map(a => a.id)
    expect(earnedIds).toContain('streak_3')
    expect(earnedIds).toContain('streak_7')
    expect(earnedIds).not.toContain('streak_30')
  })

  it('topEarned kazanılanların en yüksek eşiklisi', () => {
    const r = computeAchievements({ streak: 30, candidateCount: 12, teamSize: 0 })
    expect(r.topEarned?.id).toBe('streak_30')
    expect(r.topEarned?.threshold).toBe(30)
  })

  it('next en küçük kalan farkı olan kazanılmamış rozet', () => {
    // candidates: 9 → candidates_10 (kalan 1) en yakın
    const r = computeAchievements({ streak: 0, candidateCount: 9, teamSize: 0 })
    expect(r.next?.id).toBe('candidates_10')
  })

  it('earnedCount tüm grupları toplar', () => {
    const r = computeAchievements({ streak: 3, candidateCount: 10, teamSize: 1 })
    // streak_3, candidates_1, candidates_10, team_1 = 4
    expect(r.earnedCount).toBe(4)
  })

  it('current değeri gruba göre doğru eşlenir', () => {
    const r = computeAchievements({ streak: 5, candidateCount: 20, teamSize: 2 })
    expect(r.achievements.find(a => a.id === 'streak_7')?.current).toBe(5)
    expect(r.achievements.find(a => a.id === 'candidates_50')?.current).toBe(20)
    expect(r.achievements.find(a => a.id === 'team_5')?.current).toBe(2)
  })

  it('tüm eşikler aşılınca next null', () => {
    const r = computeAchievements({ streak: 100, candidateCount: 100, teamSize: 100 })
    expect(r.next).toBeNull()
    expect(r.earnedCount).toBe(9)
  })
})
