/**
 * Başarılar & Rozetler (gamification & tanınma) — SAF, şirketten bağımsız.
 * Rozetler mevcut metriklerden türetilir (streak, aday sayısı, ekip boyu);
 * yeni tablo/migration yok. Etiketler i18n'de (`achievements.*`), domain yalnız
 * id/grup/eşik/durum döndürür.
 */

export type AchievementGroup = 'streak' | 'candidates' | 'team'

export type AchievementId =
  | 'streak_3' | 'streak_7' | 'streak_30'
  | 'candidates_1' | 'candidates_10' | 'candidates_50'
  | 'team_1' | 'team_5' | 'team_25'

export interface AchievementInput {
  streak: number
  candidateCount: number
  teamSize: number
}

export interface Achievement {
  id: AchievementId
  group: AchievementGroup
  threshold: number
  earned: boolean
  /** O grubun güncel değeri (eşiğe ilerleme için). */
  current: number
}

export interface AchievementsResult {
  achievements: Achievement[]
  earnedCount: number
  /** Paylaşım için öne çıkan rozet — kazanılanların en yükseği. */
  topEarned: Achievement | null
  /** Bir sonraki en yakın kilit (motivasyon) — en küçük kalan farkı olan kazanılmamış. */
  next: Achievement | null
}

const SPECS: { id: AchievementId; group: AchievementGroup; threshold: number }[] = [
  { id: 'streak_3', group: 'streak', threshold: 3 },
  { id: 'streak_7', group: 'streak', threshold: 7 },
  { id: 'streak_30', group: 'streak', threshold: 30 },
  { id: 'candidates_1', group: 'candidates', threshold: 1 },
  { id: 'candidates_10', group: 'candidates', threshold: 10 },
  { id: 'candidates_50', group: 'candidates', threshold: 50 },
  { id: 'team_1', group: 'team', threshold: 1 },
  { id: 'team_5', group: 'team', threshold: 5 },
  { id: 'team_25', group: 'team', threshold: 25 },
]

function currentFor(group: AchievementGroup, input: AchievementInput): number {
  switch (group) {
    case 'streak': return input.streak
    case 'candidates': return input.candidateCount
    case 'team': return input.teamSize
  }
}

export function computeAchievements(input: AchievementInput): AchievementsResult {
  const achievements: Achievement[] = SPECS.map(s => {
    const current = currentFor(s.group, input)
    return { ...s, current, earned: current >= s.threshold }
  })

  const earned = achievements.filter(a => a.earned)
  const topEarned = earned.length
    ? earned.reduce((best, a) => (a.threshold > best.threshold ? a : best))
    : null

  const unearned = achievements.filter(a => !a.earned)
  const next = unearned.length
    ? unearned.reduce((best, a) =>
        a.threshold - a.current < best.threshold - best.current ? a : best,
      )
    : null

  return { achievements, earnedCount: earned.length, topEarned, next }
}
