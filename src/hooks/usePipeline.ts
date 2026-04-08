import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  fetchPipelineStages,
  fetchDeals,
  fetchDeal,
  fetchDealsByContact,
  fetchStageHistory,
  fetchPipelineStats,
} from '@/lib/pipeline/queries'
import {
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  createDeal,
  updateDeal,
  deleteDeal,
  moveDealToStage,
  closeDeal,
  reopenDeal,
} from '@/lib/pipeline/mutations'
import type { PipelineStage, PipelineStageInsert, PipelineStageUpdate, DealInsert, DealUpdate, DealFilters } from '@/lib/pipeline/types'

// ─── Query Keys ───────────────────────────────────────────────

export const pipelineKeys = {
  all: ['pipeline'] as const,
  stages: (userId: string) => [...pipelineKeys.all, 'stages', userId] as const,
  deals: (userId: string, filters?: DealFilters) => [...pipelineKeys.all, 'deals', userId, filters] as const,
  deal: (dealId: string) => [...pipelineKeys.all, 'deal', dealId] as const,
  contactDeals: (contactId: string) => [...pipelineKeys.all, 'contactDeals', contactId] as const,
  stageHistory: (dealId: string) => [...pipelineKeys.all, 'stageHistory', dealId] as const,
  stats: (userId: string) => [...pipelineKeys.all, 'stats', userId] as const,
}

// ─── Stage Queries ────────────────────────────────────────────

export function usePipelineStages(userId: string) {
  return useQuery({
    queryKey: pipelineKeys.stages(userId),
    queryFn: () => fetchPipelineStages(userId),
    enabled: !!userId,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

// ─── Deal Queries ─────────────────────────────────────────────

export function useDeals(userId: string, filters?: DealFilters) {
  return useQuery({
    queryKey: pipelineKeys.deals(userId, filters),
    queryFn: () => fetchDeals(userId, filters),
    enabled: !!userId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useDeal(dealId: string) {
  return useQuery({
    queryKey: pipelineKeys.deal(dealId),
    queryFn: () => fetchDeal(dealId),
    enabled: !!dealId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useDealsByContact(contactId: string, userId: string) {
  return useQuery({
    queryKey: pipelineKeys.contactDeals(contactId),
    queryFn: () => fetchDealsByContact(contactId, userId),
    enabled: !!contactId && !!userId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useStageHistory(dealId: string) {
  return useQuery({
    queryKey: pipelineKeys.stageHistory(dealId),
    queryFn: () => fetchStageHistory(dealId),
    enabled: !!dealId,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function usePipelineStats(userId: string) {
  return useQuery({
    queryKey: pipelineKeys.stats(userId),
    queryFn: () => fetchPipelineStats(userId),
    enabled: !!userId,
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

// ─── Stage Mutations ──────────────────────────────────────────

export function useCreateStage(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: PipelineStageInsert) => createStage(data),
    onSuccess: (createdStage) => {
      qc.setQueryData(pipelineKeys.stages(userId), (current: PipelineStage[] | undefined) =>
        current ? [...current, createdStage].sort((a, b) => a.position - b.position) : [createdStage]
      )
      toast.success(t('pipeline.stage.created'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useUpdateStage(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PipelineStageUpdate }) => updateStage(id, data),
    onSuccess: (updatedStage) => {
      qc.setQueryData(pipelineKeys.stages(userId), (current: PipelineStage[] | undefined) =>
        current
          ? current.map((stage) => (stage.id === updatedStage.id ? updatedStage : stage)).sort((a, b) => a.position - b.position)
          : current
      )
      toast.success(t('pipeline.stage.updated'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useDeleteStage(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteStage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.stages(userId) })
      toast.success(t('pipeline.stage.deleted'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useReorderStages(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: Array<{ id: string; position: number }>) => reorderStages(stages),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.stages(userId) })
    },
  })
}

// ─── Deal Mutations ───────────────────────────────────────────

export function useCreateDeal(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: DealInsert) => createDeal(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
      qc.invalidateQueries({ queryKey: pipelineKeys.stats(userId) })
      toast.success(t('pipeline.deal.created'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useUpdateDeal(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DealUpdate }) => updateDeal(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
      qc.invalidateQueries({ queryKey: pipelineKeys.deal(id) })
      qc.invalidateQueries({ queryKey: pipelineKeys.stats(userId) })
      toast.success(t('pipeline.deal.updated'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useDeleteDeal(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteDeal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
      qc.invalidateQueries({ queryKey: pipelineKeys.stats(userId) })
      toast.success(t('pipeline.deal.deleted'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useMoveDeal(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ dealId, stageId, position }: { dealId: string; stageId: string; position: number }) =>
      moveDealToStage(dealId, stageId, position),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
      qc.invalidateQueries({ queryKey: pipelineKeys.stats(userId) })
    },
  })
}

export function useCloseDeal(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, status, lostReason }: { id: string; status: 'won' | 'lost'; lostReason?: string }) =>
      closeDeal(id, status, lostReason),
    onSuccess: (_, { id, status }) => {
      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
      qc.invalidateQueries({ queryKey: pipelineKeys.deal(id) })
      qc.invalidateQueries({ queryKey: pipelineKeys.stats(userId) })
      toast.success(status === 'won' ? t('pipeline.deal.won') : t('pipeline.deal.lost'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useReopenDeal(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => reopenDeal(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: pipelineKeys.deals(userId) })
      qc.invalidateQueries({ queryKey: pipelineKeys.deal(id) })
      qc.invalidateQueries({ queryKey: pipelineKeys.stats(userId) })
      toast.success(t('pipeline.deal.reopened'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}
