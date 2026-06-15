import { describe, it, expect } from 'vitest'
import { sortContentPlans, type ContentPlanRecord } from '@/lib/domain/contentPlans'

const p = (id: string, scheduled_for: string, is_posted = false): ContentPlanRecord => ({
  id,
  platform: 'instagram',
  scheduled_for,
  body: 'x',
  is_posted,
})

describe('sortContentPlans', () => {
  it('paylaşılmamışlar önce, en yakın tarih üstte', () => {
    const r = sortContentPlans([p('c', '2026-06-20'), p('a', '2026-06-10'), p('b', '2026-06-15')])
    expect(r.map(x => x.id)).toEqual(['a', 'b', 'c'])
  })

  it('paylaşılanlar en sona (yeniden eskiye)', () => {
    const r = sortContentPlans([
      p('posted-old', '2026-05-01', true),
      p('upcoming', '2026-06-20', false),
      p('posted-new', '2026-06-01', true),
    ])
    expect(r.map(x => x.id)).toEqual(['upcoming', 'posted-new', 'posted-old'])
  })

  it('girdi mutasyona uğramaz', () => {
    const input = [p('b', '2026-06-15'), p('a', '2026-06-10')]
    sortContentPlans(input)
    expect(input.map(x => x.id)).toEqual(['b', 'a'])
  })
})
