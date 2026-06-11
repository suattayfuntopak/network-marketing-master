import { describe, it, expect } from 'vitest'
import { storagePathFromPublicUrl } from './avatarStorage'

describe('storagePathFromPublicUrl', () => {
  it('extracts path from nmm-avatars public URL', () => {
    const url =
      'https://xikdoilfjqggkeagiuuv.supabase.co/storage/v1/object/public/nmm-avatars/avatars/candidate_abc_1.jpg'
    expect(storagePathFromPublicUrl(url)).toBe('avatars/candidate_abc_1.jpg')
  })

  it('returns null for external URLs', () => {
    expect(storagePathFromPublicUrl('https://cdn.example.com/a.jpg')).toBeNull()
    expect(storagePathFromPublicUrl(null)).toBeNull()
  })
})
