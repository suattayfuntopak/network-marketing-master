import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { fetchAcademyContents, fetchAcademyContent } from '@/lib/academy/queries'
import {
  createAcademyContent, updateAcademyContent, deleteAcademyContent,
  incrementContentViewCount,
} from '@/lib/academy/mutations'
import { isSystemAcademyId } from '@/lib/academy/systemContent'
import { setSystemFavorite } from '@/lib/academy/favorites'
import type { AcademyContentInsert, AcademyContentUpdate, AcademyFilters } from '@/lib/academy/types'

export const academyKeys = {
  all: ['academy'] as const,
  list: (filters?: AcademyFilters) => [...academyKeys.all, 'list', filters] as const,
  detail: (id: string) => [...academyKeys.all, 'detail', id] as const,
}

export function useAcademyContents(filters?: AcademyFilters) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: [...academyKeys.list(filters), i18n.language],
    queryFn: () => fetchAcademyContents(filters),
    staleTime: 60_000,
  })
}

export function useAcademyContent(id: string) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: [...academyKeys.detail(id), i18n.language],
    queryFn: () => fetchAcademyContent(id),
    enabled: !!id,
  })
}

export function useCreateAcademyContent() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (data: AcademyContentInsert) => createAcademyContent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.all })
      toast.success(t('academy.content.created'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useUpdateAcademyContent() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AcademyContentUpdate }) =>
      updateAcademyContent(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: academyKeys.all })
      qc.invalidateQueries({ queryKey: academyKeys.detail(id) })
      toast.success(t('academy.content.updated'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useDeleteAcademyContent() {
  const qc = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: string) => deleteAcademyContent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.all })
      toast.success(t('academy.content.deleted'))
    },
    onError: () => toast.error(t('common.unknownError')),
  })
}

export function useToggleAcademyFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      if (isSystemAcademyId(id)) {
        setSystemFavorite('academy', id, isFavorite)
        return
      }

      await updateAcademyContent(id, { is_favorite: isFavorite })
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: academyKeys.all })
      qc.invalidateQueries({ queryKey: academyKeys.detail(id) })
    },
  })
}

export function useIncrementContentView() {
  return useMutation({
    mutationFn: (id: string) => incrementContentViewCount(id),
  })
}
