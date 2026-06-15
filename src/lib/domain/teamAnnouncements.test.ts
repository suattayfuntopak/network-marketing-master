import { describe, it, expect } from 'vitest'
import { annotateAnnouncements, type AnnouncementRecord } from '@/lib/domain/teamAnnouncements'

const rec = (id: string, author_id: string, created_at: string): AnnouncementRecord => ({
  id,
  author_id,
  author_name: `A-${author_id}`,
  title: `T-${id}`,
  body: 'body',
  created_at,
})

describe('annotateAnnouncements', () => {
  it('isMine doğru işaretlenir', () => {
    const r = annotateAnnouncements(
      [rec('1', 'me', '2026-06-10T00:00:00Z'), rec('2', 'lider', '2026-06-11T00:00:00Z')],
      'me',
    )
    expect(r.find(a => a.id === '1')?.isMine).toBe(true)
    expect(r.find(a => a.id === '2')?.isMine).toBe(false)
  })

  it('yeniden eskiye sıralar', () => {
    const r = annotateAnnouncements(
      [
        rec('eski', 'x', '2026-06-01T00:00:00Z'),
        rec('yeni', 'x', '2026-06-12T00:00:00Z'),
        rec('orta', 'x', '2026-06-08T00:00:00Z'),
      ],
      'me',
    )
    expect(r.map(a => a.id)).toEqual(['yeni', 'orta', 'eski'])
  })

  it('boş giriş → boş çıkış', () => {
    expect(annotateAnnouncements([], 'me')).toEqual([])
  })
})
