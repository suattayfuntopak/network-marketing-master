'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/stages'
import type { NmmCandidate, NmmCandidateInsert, NmmCandidateUpdate, NmmDailyAction, CandidateStage, ActionType } from '@/types/database.types'

export type CandidateFilter = 'tumü' | 'aktif' | 'sicak' | 'kaybolanlar'

async function fetchCandidates(workspaceId: string): Promise<NmmCandidate[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('nmm_candidates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates', workspaceId] })
      toast.success('Aday eklendi')
    },
    onError: (e: Error) => toast.error(`Eklenemedi: ${e.message}`),
  })
}

export function useUpdateCandidate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: NmmCandidateUpdate & { id: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('nmm_candidates')
        .update(patch)
        .eq('id', id)
      if (error) throw new Error(error.message)

      // Stage değişikliğini aktivite geçmişine logla
      if (patch.stage) {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await supabase.from('nmm_daily_actions').insert({
            workspace_id: workspaceId,
            user_id: session.user.id,
            candidate_id: id,
            action_type: 'stage_change' as const,
            note: patch.stage,
          })
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates', workspaceId] })
      qc.invalidateQueries({ queryKey: ['activity'] })
      toast.success('Güncellendi')
    },
    onError: (e: Error) => toast.error(`Güncellenemedi: ${e.message}`),
  })
}

export function useDeleteCandidate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('nmm_candidates').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates', workspaceId] })
      toast.success('Aday silindi')
    },
    onError: (e: Error) => toast.error(`Silinemedi: ${e.message}`),
  })
}

export function useMarkContacted(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, actionType }: { id: string; actionType: ActionType }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Oturum yok')
      await Promise.all([
        supabase
          .from('nmm_candidates')
          .update({ last_contact_at: new Date().toISOString() })
          .eq('id', id),
        supabase.from('nmm_daily_actions').insert({
          workspace_id: workspaceId,
          user_id: user.id,
          candidate_id: id,
          action_type: actionType,
        }),
      ])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates', workspaceId] })
    },
    onError: (e: Error) => toast.error(`Kayıt hatası: ${e.message}`),
  })
}

export function useActivityHistory(candidateId: string) {
  return useQuery<NmmDailyAction[]>({
    queryKey: ['activity', candidateId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('nmm_daily_actions')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw new Error(error.message)
      return data ?? []
    },
    enabled: !!candidateId,
  })
}
