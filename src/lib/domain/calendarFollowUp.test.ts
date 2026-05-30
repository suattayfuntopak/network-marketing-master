import { describe, it, expect } from 'vitest'
import {
  buildCalendarByDate,
  calendarFollowUpKey,
  countOverdueFollowUps,
  followUpDueStatus,
  isFollowUpDue,
  nextFollowUpKeyAfterCompletion,
} from './calendarFollowUp'
import type { NmmCandidate } from '@/types/database.types'

function mockCandidate(overrides: Partial<NmmCandidate> = {}): NmmCandidate {
  return {
    id: 'c1',
    workspace_id: 'ws1',
    owner_id: 'u1',
    full_name: 'Test User',
    phone: null,
    stage: 'iletisim',
    warmth: 'ilik',
    note: null,
    note_tr: null,
    note_en: null,
    avatar_url: null,
    next_follow_up_at: null,
    last_contact_at: '2026-05-27T10:00:00.000Z',
    created_at: '2026-05-20T10:00:00.000Z',
    updated_at: '2026-05-27T10:00:00.000Z',
    ...overrides,
  } as NmmCandidate
}

describe('calendarFollowUpKey', () => {
  it('uses manual next_follow_up_at when set', () => {
    const c = mockCandidate({ next_follow_up_at: '2026-06-05T09:00:00.000Z' })
    expect(calendarFollowUpKey(c)).toBe('2026-06-05')
  })

  it('computes from last_contact_at + stage days', () => {
    const c = mockCandidate({
      stage: 'iletisim',
      last_contact_at: '2026-05-27T10:00:00.000Z',
      next_follow_up_at: null,
    })
    expect(calendarFollowUpKey(c)).toBe('2026-05-30')
  })

  it('returns null for terminal stages without manual date', () => {
    const c = mockCandidate({ stage: 'katildi', next_follow_up_at: null })
    expect(calendarFollowUpKey(c)).toBeNull()
  })
})

describe('followUpDueStatus', () => {
  it('marks overdue when key is before today', () => {
    const c = mockCandidate({ next_follow_up_at: '2026-05-25T12:00:00.000Z' })
    expect(followUpDueStatus(c, '2026-05-30')).toBe('past')
    expect(isFollowUpDue(c, '2026-05-30')).toBe(true)
  })

  it('marks today when key matches', () => {
    const c = mockCandidate({ next_follow_up_at: '2026-05-30T12:00:00.000Z' })
    expect(followUpDueStatus(c, '2026-05-30')).toBe('today')
  })
})

describe('nextFollowUpKeyAfterCompletion', () => {
  it('schedules from completed day + stage interval', () => {
    expect(nextFollowUpKeyAfterCompletion('2026-06-02', 'iletisim')).toBe('2026-06-05')
  })

  it('returns null for terminal stages', () => {
    expect(nextFollowUpKeyAfterCompletion('2026-06-02', 'katildi')).toBeNull()
  })
})

describe('buildCalendarByDate and countOverdueFollowUps', () => {
  it('groups candidates and counts overdue', () => {
    const list = [
      mockCandidate({ id: 'a', next_follow_up_at: '2026-05-28T12:00:00.000Z' }),
      mockCandidate({ id: 'b', next_follow_up_at: '2026-05-30T12:00:00.000Z' }),
      mockCandidate({ id: 'c', next_follow_up_at: '2026-06-02T12:00:00.000Z' }),
    ]
    const byDate = buildCalendarByDate(list)
    expect(byDate['2026-05-28']).toHaveLength(1)
    expect(byDate['2026-05-30']).toHaveLength(1)
    expect(countOverdueFollowUps(byDate, '2026-05-30')).toBe(1)
  })
})
