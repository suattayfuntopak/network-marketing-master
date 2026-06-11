import { describe, expect, it } from 'vitest'
import { memberMatchesSearch } from './memberSearch'
import type { MemberRow } from '@/lib/team/types'

const base = (overrides: Partial<MemberRow> = {}): MemberRow => ({
  user_id: 'u1',
  full_name: 'Ayşe Yılmaz',
  role: 'member',
  joined_at: null,
  candidate_count: 0,
  yeni_count: 0,
  sunum_count: 0,
  takip_count: 0,
  katildi_count: 0,
  last_activity_at: null,
  onboarding_steps: [],
  avatar_url: null,
  phone: '+905551112233',
  isAppUser: true,
  pipeline_id: null,
  ...overrides,
})

describe('memberMatchesSearch', () => {
  it('matches empty query to all', () => {
    expect(memberMatchesSearch(base(), '')).toBe(true)
  })

  it('matches by name substring', () => {
    expect(memberMatchesSearch(base(), 'ayşe')).toBe(true)
    expect(memberMatchesSearch(base(), 'mehmet')).toBe(false)
  })

  it('matches by phone digits', () => {
    expect(memberMatchesSearch(base(), '555111')).toBe(true)
  })
})
