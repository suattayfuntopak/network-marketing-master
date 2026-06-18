import { describe, it, expect } from 'vitest'
import { formatCandidateContextForYazar } from '@/lib/domain/yazarCandidateContext'
import type { YazarContextAction } from '@/lib/domain/yazarCandidateContext'
import type { NmmCandidate } from '@/types/database.types'

const t = (k: string) => k

const baseCandidate = {
  id: 'c1',
  workspace_id: 'ws1',
  owner_id: 'u1',
  full_name: 'Ayşe Yılmaz',
  stage: 'iletisim',
  phone: null,
  email: null,
  note: 'Not metni',
  note_tr: 'Not metni',
  note_en: 'Note text',
  warmth: 'ilik',
  next_follow_up_at: null,
  last_contact_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as NmmCandidate

describe('formatCandidateContextForYazar', () => {
  it('includes candidate name and stage in TR', () => {
    const text = formatCandidateContextForYazar(baseCandidate, [], 'tr', t)
    expect(text).toContain('Ayşe Yılmaz')
    expect(text).toContain('Aday:')
    expect(text).toContain('Not metni')
  })

  it('includes candidate name in EN', () => {
    const text = formatCandidateContextForYazar(baseCandidate, [], 'en', t)
    expect(text).toContain('Ayşe Yılmaz')
    expect(text).toContain('Candidate:')
    expect(text).toContain('Note text')
  })

  it('renders call activity via renderActivityText', () => {
    const actions = [
      {
        action_type: 'call',
        note: null,
        created_at: '2026-06-01T10:00:00Z',
      },
    ] as YazarContextAction[]
    const text = formatCandidateContextForYazar(baseCandidate, actions, 'tr', t)
    expect(text).toContain('pipeline.activityCall')
    expect(text).toContain('Son Aktiviteler')
  })
})
