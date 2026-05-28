import type { MemberRow } from '@/lib/team/types'

/** Subtle role-tinted card surface for Ekibim member list (light + dark). */
export function getTeamMemberCardClasses(
  m: Pick<MemberRow, 'role' | 'isAppUser'>,
  isInactive: boolean
): string {
  if (isInactive) {
    return 'border-amber-200/60 bg-amber-50/10 dark:border-amber-900/25 dark:bg-amber-950/8'
  }
  if (m.role === 'leader') {
    return 'border-sky-200/90 bg-sky-50/35 dark:border-sky-800/50 dark:bg-sky-950/18'
  }
  if (m.isAppUser === false) {
    // Saha ortağı — NMM ortağı kadar belirgin çerçeve (hafif amber ton)
    return [
      'border-amber-300 bg-amber-50/50',
      'ring-1 ring-amber-200/80',
      'dark:border-amber-600/70 dark:bg-amber-950/22 dark:ring-amber-800/40',
    ].join(' ')
  }
  return 'border-violet-200/85 bg-violet-50/28 dark:border-violet-800/45 dark:bg-violet-950/14'
}
