'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { fetchCandidatesAction, fetchCandidateDetailAction } from '@/app/(dashboard)/actions/candidates'
import { getLang } from '@/lib/utils/getLang'
import { queryKeys } from '@/lib/query/keys'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/domain/stages'
import type { NmmCandidate, NmmCandidateInsert, NmmCandidateUpdate, NmmDailyAction, CandidateStage, ActionType } from '@/types/database.types'

import { resolveCandidateFields } from '@/lib/domain/candidateFields'
import { buildDailyActionNoteFields, buildPresentationWhatsAppActivityFields } from '@/lib/domain/dailyActionNote'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'

function invalidateCandidateQueries(qc: ReturnType<typeof useQueryClient>, workspaceId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.candidates(workspaceId) })
  qc.invalidateQueries({ queryKey: ['candidate', workspaceId] })
}

export type CandidateFilter = 'tumü' | 'aktif' | 'sicak' | 'takip_zamani' | 'kaybolanlar' | 'yeni' | 'iletisim' | 'davetli' | 'sunum' | 'takip' | 'kararsiz' | 'katildi' | 'ilgilenmedi' | 'pasif' | 'kayboldu'

export function useCandidates(workspaceId: string | undefined, filter: CandidateFilter = 'tumü') {
  const query = useQuery({
    queryKey: workspaceId ? queryKeys.candidates(workspaceId) : ['candidates', 'none'],
    queryFn: () => fetchCandidatesAction(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000,
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

/** Pipeline detay — liste cache'inden bağımsız tek aday fetch. */
export function useCandidateDetail(workspaceId: string | undefined, candidateId: string) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey:
      workspaceId && candidateId
        ? queryKeys.candidateDetail(workspaceId, candidateId)
        : ['candidate', 'none'],
    queryFn: () => fetchCandidateDetailAction(workspaceId!, candidateId),
    enabled: !!workspaceId && !!candidateId,
    staleTime: 60_000,
    initialData: () => {
      if (!workspaceId) return undefined
      const list = queryClient.getQueryData<NmmCandidate[]>(queryKeys.candidates(workspaceId))
      return list?.find(c => c.id === candidateId)
    },
  })
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
      invalidateCandidateQueries(qc, workspaceId)
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

      // Aktivite "öncesi" değerini stale cache'den DEĞİL, güncellemeden hemen önce
      // DB'den taze oku. Aksi halde iki sekme aynı adayı güncellerken yanlış
      // stage_change ("iletisim→davetli" yerine gerçek "sunum→davetli") loglanır.
      const { data: currentCandidate } = await supabase
        .from('nmm_candidates')
        .select('*')
        .eq('id', id)
        .single()

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

          // Warmth change (typed column or legacy note fallback)
          if (patch.warmth !== undefined && patch.warmth !== currentCandidate.warmth) {
            const currentWarmth = resolveCandidateFields(currentCandidate).warmth
            const newWarmth = patch.warmth
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
      invalidateCandidateQueries(qc, workspaceId)
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
      invalidateCandidateQueries(qc, workspaceId)
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
      invalidateCandidateQueries(qc, workspaceId)
    },
    onError: (e: Error) => toast.error(getLang() === 'en' ? `Contact recording error: ${e.message}` : `Kayıt hatası: ${e.message}`),
  })
}

export function useLogPresentationWhatsApp(workspaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      candidateId,
      materialTitle,
    }: {
      candidateId: string
      materialTitle: string
    }) => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Oturum yok')

      const noteFields = buildPresentationWhatsAppActivityFields(materialTitle)

      await Promise.all([
        supabase
          .from('nmm_candidates')
          .update({ last_contact_at: new Date().toISOString() })
          .eq('id', candidateId),
        supabase.from('nmm_daily_actions').insert({
          workspace_id: workspaceId,
          user_id: user.id,
          candidate_id: candidateId,
          action_type: 'whatsapp',
          ...noteFields,
        }),
      ])
    },
    onSuccess: (_data, vars) => {
      invalidateCandidateQueries(qc, workspaceId)
      qc.invalidateQueries({ queryKey: ['activity', vars.candidateId] })
      invalidateTeamAndAIUsage(qc, workspaceId)
    },
    onError: (e: Error) =>
      toast.error(
        getLang() === 'en'
          ? `Could not log activity: ${e.message}`
          : `Aktivite kaydedilemedi: ${e.message}`
      ),
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
    mutationFn: async ({
      candidateId,
      noteTr,
      noteEn,
    }: {
      candidateId: string
      noteTr: string
      noteEn?: string
    }) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Oturum yok')

      const { error } = await supabase.from('nmm_daily_actions').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        candidate_id: candidateId,
        action_type: 'note' as const,
        ...buildDailyActionNoteFields({ noteTr, noteEn }),
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
