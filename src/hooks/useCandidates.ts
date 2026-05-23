'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { NmmCandidate, NmmCandidateInsert, NmmCandidateUpdate, CandidateStage } from '@/types/database.types'

export type CandidateFilter = 'tumü' | 'aktif' | 'sicak' | 'kaybolanlar'

const ACTIVE_STAGES: CandidateStage[] = ['yeni', 'iletisim', 'takip', 'sunum', 'kararsiz']
const HOT_STAGES: CandidateStage[] = ['takip', 'sunum']

async function fetchCandidates(workspaceId: string): Promise<NmmCandidate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('nmm_candidates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export function useCandidates(workspaceId: string | undefined, filter: CandidateFilter = 'tumü') {
  const query = useQuery({
    queryKey: ['candidates', workspaceId],
    queryFn: () => fetchCandidates(workspaceId!),
    enabled: !!workspaceId,
  })

  const filtered = (query.data ?? []).filter(c => {
    if (filter === 'aktif') return ACTIVE_STAGES.includes(c.stage)
    if (filter === 'sicak') return HOT_STAGES.includes(c.stage)
    if (filter === 'kaybolanlar') return c.stage === 'kayboldu'
    return true
  })

  return { ...query, candidates: filtered }
}

export function useAddCandidate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<NmmCandidateInsert, 'workspace_id' | 'owner_id'>) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Oturum yok')

      const { error } = await supabase.from('nmm_candidates').insert({
        ...payload,
        workspace_id: workspaceId,
        owner_id: user.id,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates', workspaceId] }),
  })
}

export function useUpdateCandidate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: NmmCandidateUpdate & { id: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('nmm_candidates')
        .update({ ...patch, last_contact_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates', workspaceId] }),
  })
}
