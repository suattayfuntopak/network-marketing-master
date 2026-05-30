import { describe, it, expect } from 'vitest'
import { buildDailyPriorities } from './dailyPriorities'
import type { NmmCandidate } from '@/types/database.types'

function mockCandidate(overrides: Partial<NmmCandidate> = {}): NmmCandidate {
  return {
    id: 'c1',
    workspace_id: 'ws1',
    owner_id: 'u1',
    full_name: 'Test',
    phone: null,
    stage: 'iletisim',
    warmth: 'ilik',
    note: null,
    note_tr: null,
    note_en: null,
    avatar_url: null,
    next_follow_up_at: '2026-05-30T12:00:00.000Z',
    last_contact_at: '2026-05-27T10:00:00.000Z',
    created_at: '2026-05-20T10:00:00.000Z',
    updated_at: '2026-05-27T10:00:00.000Z',
    ...overrides,
  } as NmmCandidate
}

describe('buildDailyPriorities', () => {
  it('includes candidates due today or overdue per calendar formula', () => {
    const today = '2026-05-30'
    const dueToday = mockCandidate({ id: 'a', next_follow_up_at: '2026-05-30T12:00:00.000Z' })
    const overdue = mockCandidate({ id: 'b', next_follow_up_at: '2026-05-28T12:00:00.000Z' })
    const future = mockCandidate({ id: 'c', next_follow_up_at: '2026-06-10T12:00:00.000Z' })
    const terminal = mockCandidate({ id: 'd', stage: 'katildi', next_follow_up_at: null })

    const { all } = buildDailyPriorities([dueToday, overdue, future, terminal], today)
    expect(all.map(c => c.id)).toEqual(['b', 'a'])
  })

  it('limits daily slice to maxDaily', () => {
    const today = '2026-05-30'
    const list = Array.from({ length: 7 }, (_, i) =>
      mockCandidate({
        id: `c${i}`,
        next_follow_up_at: '2026-05-30T12:00:00.000Z',
        stage: 'yeni',
      }),
    )
    const { daily, remaining } = buildDailyPriorities(list, today, 5)
    expect(daily).toHaveLength(5)
    expect(remaining).toBe(2)
  })
})
