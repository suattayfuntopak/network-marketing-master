import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTags } from '@/lib/contacts/queries'
import { createTag, deleteTag } from '@/lib/contacts/mutations'
import type { TagInsert } from '@/types/database'
import { contactKeys } from './useContacts'

export const tagKeys = {
  all: ['tags'] as const,
  list: (userId: string) => [...tagKeys.all, userId] as const,
}

export function useTags(userId: string | undefined) {
  return useQuery({
    queryKey: tagKeys.list(userId ?? ''),
    queryFn: () => fetchTags(userId!),
    enabled: !!userId,
  })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TagInsert) => createTag(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTag(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tagKeys.all })
      qc.invalidateQueries({ queryKey: contactKeys.all })
    },
  })
}
