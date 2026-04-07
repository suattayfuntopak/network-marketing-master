import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { fetchTemplates, fetchTemplate, fetchAIMessages } from '@/lib/messages/queries'
import {
  createTemplate, updateTemplate, deleteTemplate,
  toggleTemplateFavorite, saveAIMessage, markAIMessageUsed, rateAIMessage,
} from '@/lib/messages/mutations'
import type { MessageTemplateInsert, MessageTemplateUpdate, AIMessageInsert, TemplateFilters } from '@/lib/messages/types'

export const templateKeys = {
  all: ['templates'] as const,
  list: (userId: string, filters?: TemplateFilters) => [...templateKeys.all, 'list', userId, filters] as const,
  detail: (id: string) => [...templateKeys.all, 'detail', id] as const,
  aiMessages: (userId: string, contactId?: string) => [...templateKeys.all, 'aiMessages', userId, contactId] as const,
}

// ─── Template queries ─────────────────────────────────────────

export function useTemplates(userId: string, filters?: TemplateFilters) {
  return useQuery({
    queryKey: templateKeys.list(userId, filters),
    queryFn: () => fetchTemplates(userId, filters),
    enabled: !!userId,
    staleTime: 30_000,
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => fetchTemplate(id),
    enabled: !!id,
  })
}

export function useAIMessages(userId: string, contactId?: string) {
  return useQuery({
    queryKey: templateKeys.aiMessages(userId, contactId),
    queryFn: () => fetchAIMessages(userId, contactId),
    enabled: !!userId,
    staleTime: 0,
  })
}

// ─── Template mutations ───────────────────────────────────────

export function useCreateTemplate(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: MessageTemplateInsert) => createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.list(userId) })
      toast.success(t('messages.template.created'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useUpdateTemplate(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MessageTemplateUpdate }) => updateTemplate(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: templateKeys.list(userId) })
      qc.invalidateQueries({ queryKey: templateKeys.detail(id) })
      toast.success(t('messages.template.updated'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useDeleteTemplate(userId: string) {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.list(userId) })
      toast.success(t('messages.template.deleted'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useToggleTemplateFavorite(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      toggleTemplateFavorite(id, isFavorite),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.list(userId) })
    },
  })
}

// ─── AI message mutations ─────────────────────────────────────

export function useSaveAIMessage(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AIMessageInsert) => saveAIMessage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.aiMessages(userId) })
    },
  })
}

export function useMarkAIMessageUsed(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, finalContent }: { id: string; finalContent?: string }) =>
      markAIMessageUsed(id, finalContent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templateKeys.aiMessages(userId) })
    },
  })
}

export function useRateAIMessage() {
  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: 'great' | 'good' | 'meh' | 'bad' }) =>
      rateAIMessage(id, feedback),
  })
}
