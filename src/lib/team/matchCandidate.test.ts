import { describe, it, expect } from 'vitest'
import {
  cleanMemberName,
  phoneTail,
  scoreMemberCandidateNameMatch,
  scoreMemberCandidateMatch,
  findLeaderCandidateForMember,
} from './matchCandidate'

describe('scoreMemberCandidateNameMatch', () => {
  it('exact match scores 100', () => {
    expect(scoreMemberCandidateNameMatch('Ahmet Yılmaz', 'Ahmet Yılmaz')).toBe(100)
  })

  it('substring match scores 85', () => {
    expect(scoreMemberCandidateNameMatch('Ahmet Y.', 'Ahmet Yılmaz')).toBe(85)
  })

  it('two word overlap scores at least 80', () => {
    expect(scoreMemberCandidateNameMatch('Mehmet Ali Kaya', 'Mehmet Ali Demir')).toBeGreaterThanOrEqual(80)
  })

  it('single shared surname does not match', () => {
    expect(scoreMemberCandidateNameMatch('Ayşe Topak', 'Suat Topak')).toBe(0)
  })

  it('Turkish chars normalize consistently', () => {
    expect(cleanMemberName('Işıl')).toBe(cleanMemberName('Isil'))
  })
})

describe('scoreMemberCandidateMatch', () => {
  it('phone tail match scores 110', () => {
    expect(
      scoreMemberCandidateMatch('X', '+90 532 111 22 33', 'Y', '05321112233'),
    ).toBe(110)
  })

  it('phone beats weaker name match', () => {
    expect(
      scoreMemberCandidateMatch('Ayşe', '5321112233', 'Mehmet Demir', '5321112233'),
    ).toBe(110)
  })
})

describe('phoneTail', () => {
  it('normalizes to last 10 digits', () => {
    expect(phoneTail('+90 (532) 111-22-33')).toBe('5321112233')
  })
})

describe('findLeaderCandidateForMember', () => {
  const pool = [
    { id: 'a1', full_name: 'Ahmet Yılmaz', owner_id: 'leader', phone: '5321112233' },
    { id: 'a2', full_name: 'Mehmet Demir', owner_id: 'leader' },
    { id: 'a3', full_name: 'Ahmet Y.', owner_id: 'other' },
  ]

  it('picks best leader-owned match above threshold', () => {
    expect(findLeaderCandidateForMember(pool, 'leader', 'Ahmet Yılmaz')).toBe('a1')
    expect(findLeaderCandidateForMember(pool, 'leader', 'Ahmet Y.')).toBe('a1')
  })

  it('returns null when score below 80', () => {
    expect(findLeaderCandidateForMember(pool, 'leader', 'Ayşe Topak')).toBeNull()
  })

  it('matches by phone when name differs', () => {
    expect(findLeaderCandidateForMember(pool, 'leader', 'A. Y.', '5321112233')).toBe('a1')
  })
})
