'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getLang } from '@/lib/utils/getLang'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/domain/stages'
import type { NmmCandidate, NmmCandidateInsert, NmmCandidateUpdate, NmmDailyAction, CandidateStage, ActionType } from '@/types/database.types'

import { parseNote } from '@/lib/utils/noteParser'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'

export type CandidateFilter = 'tumü' | 'aktif' | 'sicak' | 'takip_zamani' | 'kaybolanlar' | 'yeni' | 'iletisim' | 'davetli' | 'sunum' | 'takip' | 'kararsiz' | 'katildi' | 'ilgilenmedi' | 'pasif' | 'kayboldu'

async function fetchCandidates(workspaceId: string): Promise<NmmCandidate[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Oturum bulunamadı.')

  const { data, error } = await supabase
    .from('nmm_candidates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export function useCandidates(workspaceId: string | undefined, filter: CandidateFilter = 'tumü') {
  const query = useQuery({
    queryKey: ['candidates', workspaceId],
    queryFn: () => fetchCandidates(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  })

  const filtered = (query.data ?? []).filter(c => {
    if (filter === 'aktif') return ACTIVE_STAGES.includes(c.stage)
    if (filter === 'sicak') return HOT_STAGES.includes(c.stage)
    if (filter === 'kaybolanlar') return c.stage === 'kayboldu'
    // Stage-specific filters
    const stageFilters = ['yeni', 'iletisim', 'davetli', 'sunum', 'takip', 'kararsiz', 'katildi', 'ilgilenmedi', 'pasif', 'kayboldu']
    if (stageFilters.includes(filter as string)) return c.stage === filter
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

      const { data, error } = await supabase
        .from('nmm_candidates')
        .insert({
          ...payload,
          workspace_id: workspaceId,
          owner_id: user.id,
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)

      if (data) {
        await supabase.from('nmm_daily_actions').insert({
          workspace_id: workspaceId,
          user_id: user.id,
          candidate_id: data.id,
          action_type: 'note' as const,
          note: 'system_note:candidate_created',
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates', workspaceId] })
      toast.success(getLang() === 'en' ? 'Candidate added' : 'Aday eklendi')
    },
    onError: (e: Error) => toast.error(getLang() === 'en' ? `Failed to add: ${e.message}` : `Eklenemedi: ${e.message}`),
  })
}

export function useUpdateCandidate(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: NmmCandidateUpdate & { id: string }) => {
      const supabase = createClient()

      const cached = qc.getQueryData<NmmCandidate[]>(['candidates', workspaceId])
      const currentCandidate =
        cached?.find(c => c.id === id) ??
        (await supabase.from('nmm_candidates').select('*').eq('id', id).single()).data

      const { error } = await supabase
        .from('nmm_candidates')
        .update(patch)
        .eq('id', id)
        .select('id')
        .single()
      if (error) throw new Error(error.message)

      if (currentCandidate) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const inserts: any[] = []

          // Stage change
          if (patch.stage && patch.stage !== currentCandidate.stage) {
            inserts.push({
              workspace_id: workspaceId,
              user_id: user.id,
              candidate_id: id,
              action_type: 'stage_change' as const,
              note: patch.stage,
            })
          }

          // Warmth change
          if (patch.note !== undefined && patch.note !== currentCandidate.note) {
            const currentWarmth = parseNote(currentCandidate.note).warmth || 'ilik'
            const newWarmth = parseNote(patch.note).warmth || 'ilik'
            if (currentWarmth !== newWarmth) {
              inserts.push({
                workspace_id: workspaceId,
                user_id: user.id,
                candidate_id: id,
                action_type: 'note' as const,
                note: `system_note:warmth_change:${currentWarmth}->${newWarmth}`,
              })
            }
          }

          // Follow-up date change
          if (patch.next_follow_up_at !== undefined && patch.next_follow_up_at !== currentCandidate.next_follow_up_at) {
            const oldDate = currentCandidate.next_follow_up_at || 'none'
            const newDate = patch.next_follow_up_at || 'none'
            inserts.push({
              workspace_id: workspaceId,
              user_id: user.id,
              candidate_id: id,
              action_type: 'note' as const,
              note: `system_note:follow_up_change:${oldDate}->${newDate}`,
            })
          }

          // Profile change
          if ((patch.full_name && patch.full_name !== currentCandidate.full_name) ||
              (patch.phone !== undefined && patch.phone !== currentCandidate.phone)) {
            inserts.push({
              workspace_id: workspaceId,
              user_id: user.id,
              candidate_id: id,
              action_type: 'note' as const,
              note: 'system_note:profile_update',
            })
          }

          if (inserts.length > 0) {
            await supabase.from('nmm_daily_actions').insert(inserts)
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates', workspaceId] })
      qc.invalidateQueries({ queryKey: ['activity'] })
      invalidateTeamAndAIUsage(qc, workspaceId)
      toast.success(getLang() === 'en' ? 'Updated' : 'Güncellendi')
    },
    onError: (e: Error) => toast.error(getLang() === 'en' ? `Failed to update: ${e.message}` : `Güncellenemedi: ${e.message}`),
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
      toast.success(getLang() === 'en' ? 'Candidate deleted' : 'Aday silindi')
    },
    onError: (e: Error) => toast.error(getLang() === 'en' ? `Failed to delete: ${e.message}` : `Silinemedi: ${e.message}`),
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
    onError: (e: Error) => toast.error(getLang() === 'en' ? `Contact recording error: ${e.message}` : `Kayıt hatası: ${e.message}`),
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
        .limit(50)
      if (error) throw new Error(error.message)
      return data ?? []
    },
    enabled: !!candidateId,
  })
}

export function useCandidateNotes(candidateId: string) {
  return useQuery<NmmDailyAction[]>({
    queryKey: ['candidate-notes', candidateId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('nmm_daily_actions')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('action_type', 'note')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data ?? []
    },
    enabled: !!candidateId,
  })
}

export function useAddCandidateNote(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ candidateId, note }: { candidateId: string; note: string }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Oturum yok')

      const { error } = await supabase.from('nmm_daily_actions').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        candidate_id: candidateId,
        action_type: 'note' as const,
        note: note.trim(),
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, { candidateId }) => {
      qc.invalidateQueries({ queryKey: ['candidate-notes', candidateId] })
      qc.invalidateQueries({ queryKey: ['activity', candidateId] })
      toast.success(getLang() === 'en' ? 'Note saved' : 'Not kaydedildi')
    },
    onError: (e: Error) => toast.error(getLang() === 'en' ? `Failed to save note: ${e.message}` : `Not kaydedilemedi: ${e.message}`),
  })
}

export function useDeleteActivity(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ activityId }: { activityId: string; candidateId: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('nmm_daily_actions')
        .delete()
        .eq('id', activityId)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, { candidateId }) => {
      qc.invalidateQueries({ queryKey: ['activity', candidateId] })
      qc.invalidateQueries({ queryKey: ['candidate-notes', candidateId] })
      invalidateTeamAndAIUsage(qc, workspaceId)
    },
    onError: (e: Error) => toast.error(getLang() === 'en' ? `Failed to delete activity: ${e.message}` : `Aktivite silinemedi: ${e.message}`),
  })
}
