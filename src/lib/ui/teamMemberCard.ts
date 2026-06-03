import type { MemberRow } from '@/lib/team/types'

const cardBorder = 'border-[var(--border)]'

/** Subtle role-tinted card surface for Ekibim member list (light + dark). */
export function getTeamMemberCardClasses(
  m: Pick<MemberRow, 'role' | 'isAppUser'>,
  isInactive: boolean
): string {
  if (isInactive) {
    return `${cardBorder} bg-amber-50/10 dark:bg-amber-950/8`
  }
  if (m.role === 'leader') {
    return `${cardBorder} bg-sky-50/35 dark:bg-sky-950/18`
  }
  if (m.isAppUser === false) {
    return `${cardBorder} bg-amber-50/50 dark:bg-amber-950/22`
  }
  return `${cardBorder} bg-violet-50/28 dark:bg-violet-950/14`
}
