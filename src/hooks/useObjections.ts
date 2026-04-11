import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { fetchObjections, fetchObjection } from '@/lib/academy/queries'
import {
  createObjection, updateObjection, deleteObjection,
  toggleObjectionFavorite, incrementObjectionUseCount,
} from '@/lib/academy/mutations'
import type { ObjectionInsert, ObjectionUpdate, ObjectionFilters } from '@/lib/academy/types'

export const objectionKeys = {
  all: ['objections'] as const,
  list: (filters?: ObjectionFilters) => [...objectionKeys.all, 'list', filters] as const,
  detail: (id: string) => [...objectionKeys.all, 'detail', id] as const,
}

export function useObjections(filters?: ObjectionFilters) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: [...objectionKeys.list(filters), i18n.language],
    queryFn: () => fetchObjections(filters),
    staleTime: 60_000,
  })
}

export function useObjection(id: string) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: [...objectionKeys.detail(id), i18n.language],
    queryFn: () => fetchObjection(id),
    enabled: !!id,
  })
}

export function useCreateObjection() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: ObjectionInsert) => createObjection(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: objectionKeys.all })
      toast.success(t('academy.objection.created'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useUpdateObjection() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ObjectionUpdate }) => updateObjection(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: objectionKeys.all })
      qc.invalidateQueries({ queryKey: objectionKeys.detail(id) })
      toast.success(t('academy.objection.updated'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useDeleteObjection() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteObjection(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: objectionKeys.all })
      toast.success(t('academy.objection.deleted'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useToggleObjectionFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      toggleObjectionFavorite(id, isFavorite),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: objectionKeys.all })
    },
  })
}

export function useIncrementObjectionUseCount() {
  return useMutation({
    mutationFn: (id: string) => incrementObjectionUseCount(id),
  })
}
