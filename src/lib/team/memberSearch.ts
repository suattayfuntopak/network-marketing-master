import type { MemberRow } from '@/lib/team/types'

export function memberMatchesSearch(member: MemberRow, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return true
  const name = (member.full_name ?? '').toLowerCase()
  const phone = (member.phone ?? '').replace(/\D/g, '')
  const qPhone = q.replace(/\D/g, '')
  return name.includes(q) || (qPhone.length >= 3 && phone.includes(qPhone))
}
