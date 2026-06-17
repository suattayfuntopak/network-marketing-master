import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetAuthUser = vi.fn()

vi.mock('@/lib/supabase/authUser', () => ({
  getAuthUser: () => mockGetAuthUser(),
}))

import { requireAuthUserId, requireAuthUserIdOrNull } from '@/lib/supabase/requireAuth'

describe('requireAuth', () => {
  beforeEach(() => {
    mockGetAuthUser.mockReset()
  })

  it('requireAuthUserId returns user id when session exists', async () => {
    mockGetAuthUser.mockResolvedValue({ user: { id: 'user-1' }, error: null })
    await expect(requireAuthUserId()).resolves.toBe('user-1')
  })

  it('requireAuthUserId throws when session missing', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('no session') })
    await expect(requireAuthUserId()).rejects.toThrow('Oturum bulunamadı.')
  })

  it('requireAuthUserIdOrNull returns null when session missing', async () => {
    mockGetAuthUser.mockResolvedValue({ user: null, error: new Error('no session') })
    await expect(requireAuthUserIdOrNull()).resolves.toBeNull()
  })
})
