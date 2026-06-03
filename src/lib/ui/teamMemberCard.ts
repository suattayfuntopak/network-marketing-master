import type { MemberRow } from '@/lib/team/types'

/** Subtle role-tinted card surface for Ekibim member list (light + dark). */
export function getTeamMemberCardClasses(
  m: Pick<MemberRow, 'role' | 'isAppUser'>,
  isInactive: boolean
): string {
  if (isInactive) {
    return 'border-amber-200/60 bg-amber-50/10 dark:border-white/70 dark:bg-amber-950/8'
  }
  if (m.role === 'leader') {
    return 'border-sky-200/90 bg-sky-50/35 dark:border-white/70 dark:bg-sky-950/18'
  }
  if (m.isAppUser === false) {
    return [
      'border-amber-300 bg-amber-50/50',
      'ring-1 ring-amber-200/80',
      'dark:border-white/70 dark:bg-amber-950/22 dark:ring-white/25',
    ].join(' ')
  }
  return 'border-violet-200/85 bg-violet-50/28 dark:border-white/70 dark:bg-violet-950/14'
}
