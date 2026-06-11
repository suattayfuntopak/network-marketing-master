import { describe, it, expect } from 'vitest'
import {
  buildAvatarStoragePath,
  sanitizeCandidateIdForAvatarPath,
} from './avatarStoragePath'

describe('avatarStoragePath', () => {
  it('builds candidate path locked to candidate uuid', () => {
    const id = '00fa3484-97b1-4683-b987-638df261b6e2'
    expect(
      buildAvatarStoragePath({
        scope: 'candidate',
        userId: 'ignored',
        candidateId: id,
        fileName: 'photo.jpeg',
        nowMs: 1_700_000_000_000,
      }),
    ).toBe(`avatars/candidate_${id}_1700000000000.jpeg`)
  })

  it('rejects invalid candidate ids', () => {
    expect(() =>
      buildAvatarStoragePath({
        scope: 'candidate',
        userId: 'u',
        candidateId: 'not-a-uuid',
        fileName: 'x.jpg',
      }),
    ).toThrow(/Geçersiz aday/)
  })

  it('builds user scope path from user id', () => {
    const userId = 'eeb42bdd-6bc0-4839-b109-d28f3e55d884'
    expect(
      buildAvatarStoragePath({
        scope: 'user',
        userId,
        fileName: 'avatar.png',
        nowMs: 42,
      }),
    ).toBe(`avatars/${userId}_42.png`)
  })

  it('sanitizes candidate id', () => {
    expect(sanitizeCandidateIdForAvatarPath(' 00fa3484-97b1-4683-b987-638df261b6e2 ')).toBe(
      '00fa3484-97b1-4683-b987-638df261b6e2',
    )
    expect(sanitizeCandidateIdForAvatarPath('bad')).toBeNull()
  })
})
