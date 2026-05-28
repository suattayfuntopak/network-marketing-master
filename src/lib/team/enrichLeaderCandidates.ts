import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/** Leader-owned candidates returned by team RPC (partial row). */
export type LeaderCandidateRow = {
  id: string
  owner_id: string
  full_name: string | null
  phone: string | null
  note: string | null
  note_tr?: string | null
  note_en?: string | null
  avatar_url?: string | null
  warmth?: string | null
  stage: string
  created_at: string | null
}

/** Ensures avatar_url / typed note columns are present (RPC pre-025 or stale cache). */
export async function enrichLeaderCandidates(
  supabase: SupabaseClient<Database>,
  candidates: LeaderCandidateRow[]
): Promise<LeaderCandidateRow[]> {
  if (candidates.length === 0) return candidates

  const { data } = await supabase
    .from('nmm_candidates')
    .select('id, note, note_tr, note_en, avatar_url, warmth')
    .in(
      'id',
      candidates.map(c => c.id)
    )

  if (!data?.length) return candidates

  const byId = new Map(data.map(r => [r.id, r]))
  return candidates.map(c => {
    const row = byId.get(c.id)
    if (!row) return c
    return {
      ...c,
      note: row.note ?? c.note,
      note_tr: row.note_tr ?? c.note_tr,
      note_en: row.note_en ?? c.note_en,
      avatar_url: row.avatar_url ?? c.avatar_url,
      warmth: row.warmth ?? c.warmth,
    }
  })
}
