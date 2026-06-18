'use client'

import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  addCandidateAction,
  addCandidateNoteAction,
  deleteCandidateAction,
  deleteCandidateActivityAction,
  fetchAllCandidatesAction,
  fetchCandidateActivityHistoryAction,
  fetchCandidateDetailAction,
  fetchCandidateNotesAction,
  fetchLeaderNotesCountAction,
  markCandidateContactedAction,
  updateCandidateAction,
} from '@/app/(dashboard)/actions/candidates'
import { queryKeys } from '@/lib/query/keys'
import { QUERY_STALE } from '@/lib/query/staleTimes'
import { ACTIVE_STAGES, HOT_STAGES } from '@/lib/domain/stages'
import type { NmmCandidate, NmmCandidateInsert, NmmCandidateUpdate, NmmDailyAction, ActionType } from '@/types/database.types'

import { logPresentationWhatsAppAction } from '@/app/(dashboard)/pulse/learningEvents'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'
import { queryInvalidator } from '@/lib/query/invalidator'
import { useTranslation } from '@/providers/LanguageProvider'

function invalidateCandidateQueries(qc: ReturnType<typeof useQueryClient>, workspaceId: string, candidateId?: string) {
  queryInvalidator.invalidateCandidates(qc, workspaceId, candidateId)
}

export type CandidateFilter = 'tumü' | 'aktif' | 'sicak' | 'takip_zamani' | 'kaybolanlar' | 'yeni' | 'iletisim' | 'davetli' | 'sunum' | 'takip' | 'kararsiz' | 'katildi' | 'ilgilenmedi' | 'pasif' | 'kayboldu'

export function useCandidates(workspaceId: string | undefined, filter: CandidateFilter = 'tumü') {
  const query = useQuery({
    queryKey: workspaceId ? queryKeys.candidates(workspaceId) : ['candidates', 'none'],
    queryFn: () => fetchAllCandidatesAction(workspaceId!),
    enabled: !!workspaceId,
    staleTime: QUERY_STALE.data,
    placeholderData: keepPreviousData,
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
    staleTime: QUERY_STALE.progress,
    placeholderData: keepPreviousData,
    initialData: () => {
      if (!workspaceId) return undefined
      const list = queryClient.getQueryData<NmmCandidate[]>(queryKeys.candidates(workspaceId))
      return list?.find(c => c.id === candidateId)
    },
  })
}

export function useAddCandidate(workspaceId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async (payload: Omit<NmmCandidateInsert, 'workspace_id' | 'owner_id'>) =>
      addCandidateAction(workspaceId, payload),
    onSuccess: () => {
      invalidateCandidateQueries(qc, workspaceId)
      toast.success(t('pipelinePage.toastCandidateAdded'))
    },
    onError: (e: Error) =>
      toast.error(t('pipelinePage.toastAddFailed', { message: e.message })),
  })
}

export function useUpdateCandidate(workspaceId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async ({ id, ...patch }: NmmCandidateUpdate & { id: string }) =>
      updateCandidateAction(workspaceId, id, patch),
    // Optimistic: yeni değer (ör. takip tarihi) anında görünsün, refetch'i bekleme.
    onMutate: async ({ id, ...patch }) => {
      const detailKey = queryKeys.candidateDetail(workspaceId, id)
      const listKey = queryKeys.candidates(workspaceId)
      await Promise.all([
        qc.cancelQueries({ queryKey: detailKey }),
        qc.cancelQueries({ queryKey: listKey }),
      ])
      const prevDetail = qc.getQueryData<NmmCandidate>(detailKey)
      const prevList = qc.getQueryData<NmmCandidate[]>(listKey)
      qc.setQueryData<NmmCandidate | undefined>(detailKey, old =>
        old ? ({ ...old, ...patch } as NmmCandidate) : old
      )
      qc.setQueryData<NmmCandidate[] | undefined>(listKey, old =>
        old?.map(c => (c.id === id ? ({ ...c, ...patch } as NmmCandidate) : c))
      )
      return { prevDetail, prevList, detailKey, listKey }
    },
    onSuccess: (_, vars) => {
      invalidateCandidateQueries(qc, workspaceId, vars.id)
      invalidateTeamAndAIUsage(qc, workspaceId)
      toast.success(t('pipelinePage.toastCandidateUpdated'))
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prevDetail !== undefined) qc.setQueryData(ctx.detailKey, ctx.prevDetail)
      if (ctx?.prevList !== undefined) qc.setQueryData(ctx.listKey, ctx.prevList)
      toast.error(t('pipelinePage.toastUpdateFailed', { message: e.message }))
    },
  })
}

export function useDeleteCandidate(workspaceId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async (id: string) => deleteCandidateAction(workspaceId, id),
    onSuccess: () => {
      invalidateCandidateQueries(qc, workspaceId)
      toast.success(t('pipelinePage.toastCandidateDeleted'))
    },
    onError: (e: Error) =>
      toast.error(t('pipelinePage.toastDeleteFailed', { message: e.message })),
  })
}

export function useMarkContacted(workspaceId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async ({ id, actionType }: { id: string; actionType: ActionType }) =>
      markCandidateContactedAction(workspaceId, id, actionType),
    onMutate: async ({ id, actionType }) => {
      const detailKey = queryKeys.candidateDetail(workspaceId, id)
      const listKey = queryKeys.candidates(workspaceId)
      const activityKey = queryKeys.candidateActivity(id)

      await Promise.all([
        qc.cancelQueries({ queryKey: detailKey }),
        qc.cancelQueries({ queryKey: listKey }),
        qc.cancelQueries({ queryKey: activityKey }),
      ])

      const prevDetail = qc.getQueryData<NmmCandidate>(detailKey)
      const prevList = qc.getQueryData<NmmCandidate[]>(listKey)
      const prevActivity = qc.getQueryData<NmmDailyAction[]>(activityKey)

      const nowIso = new Date().toISOString()

      qc.setQueryData<NmmCandidate | undefined>(detailKey, old =>
        old ? { ...old, last_contact_at: nowIso } : old
      )

      qc.setQueryData<NmmCandidate[] | undefined>(listKey, old =>
        old?.map(c => (c.id === id ? { ...c, last_contact_at: nowIso } : c))
      )

      const fakeAction: NmmDailyAction = {
        id: 'temp-contact-' + Date.now(),
        workspace_id: workspaceId,
        user_id: '',
        candidate_id: id,
        action_type: actionType,
        note: null,
        note_tr: null,
        note_en: null,
        ai_model: null,
        created_at: nowIso,
      }

      qc.setQueryData<NmmDailyAction[] | undefined>(activityKey, old =>
        old ? [fakeAction, ...old] : [fakeAction]
      )

      return { prevDetail, prevList, prevActivity, detailKey, listKey, activityKey }
    },
    onSuccess: (_data, vars) => {
      invalidateCandidateQueries(qc, workspaceId, vars.id)
      toast.success(
        vars.actionType === 'call'
          ? t('pipelinePage.toastCallLogged')
          : t('pipelinePage.toastWhatsAppLogged'),
      )
    },
    onError: (e: Error, vars, ctx) => {
      if (ctx?.prevDetail !== undefined) qc.setQueryData(ctx.detailKey, ctx.prevDetail)
      if (ctx?.prevList !== undefined) qc.setQueryData(ctx.listKey, ctx.prevList)
      if (ctx?.prevActivity !== undefined) qc.setQueryData(ctx.activityKey, ctx.prevActivity)
      toast.error(t('pipelinePage.toastContactFailed', { message: e.message }))
    },
  })
}

export function useLogPresentationWhatsApp(workspaceId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async ({
      candidateId,
      materialTitle,
    }: {
      candidateId: string
      materialTitle: string
    }) => {
      await logPresentationWhatsAppAction(workspaceId, candidateId, materialTitle)
    },
    onSuccess: (_data, vars) => {
      invalidateCandidateQueries(qc, workspaceId, vars.candidateId)
      invalidateTeamAndAIUsage(qc, workspaceId)
    },
    onError: (e: Error) =>
      toast.error(t('pipelinePage.toastActivityLogFailed', { message: e.message })),
  })
}

export function useActivityHistory(candidateId: string, queryEnabled = true) {
  return useQuery<NmmDailyAction[]>({
    queryKey: queryKeys.candidateActivity(candidateId),
    queryFn: () => fetchCandidateActivityHistoryAction(candidateId),
    enabled: !!candidateId && queryEnabled,
  })
}

export function useCandidateNotes(candidateId: string, queryEnabled = true) {
  return useQuery<NmmDailyAction[]>({
    queryKey: queryKeys.candidateNotes(candidateId),
    queryFn: () => fetchCandidateNotesAction(candidateId),
    enabled: !!candidateId && queryEnabled,
  })
}

/** Kapalı kart rozeti — tam not listesi çekmeden lider notu sayısı. */
export function useLeaderNotesCount(candidateId: string, queryEnabled = true) {
  return useQuery<number>({
    queryKey: queryKeys.candidateNotesCount(candidateId),
    queryFn: () => fetchLeaderNotesCountAction(candidateId),
    enabled: !!candidateId && queryEnabled,
    staleTime: QUERY_STALE.progress,
  })
}

export function useAddCandidateNote(workspaceId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async ({
      candidateId,
      noteTr,
      noteEn,
    }: {
      candidateId: string
      noteTr: string
      noteEn?: string
    }) => addCandidateNoteAction(workspaceId, { candidateId, noteTr, noteEn }),
    onMutate: async ({ candidateId, noteTr, noteEn }) => {
      const notesKey = queryKeys.candidateNotes(candidateId)
      const activityKey = queryKeys.candidateActivity(candidateId)
      await Promise.all([
        qc.cancelQueries({ queryKey: notesKey }),
        qc.cancelQueries({ queryKey: activityKey }),
      ])
      const prevNotes = qc.getQueryData<NmmDailyAction[]>(notesKey)
      const prevActivity = qc.getQueryData<NmmDailyAction[]>(activityKey)

      const nowIso = new Date().toISOString()
      const fakeAction: NmmDailyAction = {
        id: 'temp-note-' + Date.now(),
        workspace_id: workspaceId,
        user_id: '',
        candidate_id: candidateId,
        action_type: 'note',
        note: noteTr || null,
        note_tr: noteTr || null,
        note_en: noteEn || null,
        ai_model: null,
        created_at: nowIso,
      }

      qc.setQueryData<NmmDailyAction[] | undefined>(notesKey, old =>
        old ? [fakeAction, ...old] : [fakeAction]
      )
      qc.setQueryData<NmmDailyAction[] | undefined>(activityKey, old =>
        old ? [fakeAction, ...old] : [fakeAction]
      )

      return { prevNotes, prevActivity, notesKey, activityKey }
    },
    onSuccess: (_, { candidateId }) => {
      invalidateCandidateQueries(qc, workspaceId, candidateId)
      toast.success(t('pipelinePage.toastNoteSaved'))
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prevNotes !== undefined) qc.setQueryData(ctx.notesKey, ctx.prevNotes)
      if (ctx?.prevActivity !== undefined) qc.setQueryData(ctx.activityKey, ctx.prevActivity)
      toast.error(t('pipelinePage.toastNoteFailed', { message: e.message }))
    },
  })
}

export function useDeleteActivity(workspaceId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async ({ activityId, candidateId }: { activityId: string; candidateId: string }) =>
      deleteCandidateActivityAction(workspaceId, { activityId, candidateId }),
    onMutate: async ({ activityId, candidateId }) => {
      const notesKey = queryKeys.candidateNotes(candidateId)
      const activityKey = queryKeys.candidateActivity(candidateId)
      await Promise.all([
        qc.cancelQueries({ queryKey: notesKey }),
        qc.cancelQueries({ queryKey: activityKey }),
      ])
      const prevNotes = qc.getQueryData<NmmDailyAction[]>(notesKey)
      const prevActivity = qc.getQueryData<NmmDailyAction[]>(activityKey)

      qc.setQueryData<NmmDailyAction[] | undefined>(notesKey, old =>
        old?.filter(a => a.id !== activityId)
      )
      qc.setQueryData<NmmDailyAction[] | undefined>(activityKey, old =>
        old?.filter(a => a.id !== activityId)
      )

      return { prevNotes, prevActivity, notesKey, activityKey }
    },
    onSuccess: (_, { candidateId }) => {
      invalidateCandidateQueries(qc, workspaceId, candidateId)
      invalidateTeamAndAIUsage(qc, workspaceId)
    },
    onError: (e: Error, _vars, ctx) => {
      if (ctx?.prevNotes !== undefined) qc.setQueryData(ctx.notesKey, ctx.prevNotes)
      if (ctx?.prevActivity !== undefined) qc.setQueryData(ctx.activityKey, ctx.prevActivity)
      toast.error(t('pipelinePage.toastActivityFailed', { message: e.message }))
    },
  })
}
