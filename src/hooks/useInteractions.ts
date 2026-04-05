import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchInteractions } from '@/lib/contacts/queries'
import { addInteraction } from '@/lib/contacts/mutations'
import type { AddInteractionParams } from '@/lib/contacts/types'
import { contactKeys } from './useContacts'

export const interactionKeys = {
  all: ['interactions'] as const,
  list: (contactId: string) => [...interactionKeys.all, contactId] as const,
}

export function useInteractions(contactId: string | undefined) {
  return useQuery({
    queryKey: interactionKeys.list(contactId ?? ''),
    queryFn: () => fetchInteractions(contactId!),
    enabled: !!contactId,
  })
}

export function useAddInteraction(contactId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: AddInteractionParams) => addInteraction(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interactionKeys.list(contactId) })
      qc.invalidateQueries({ queryKey: ['contact', contactId] })
      qc.invalidateQueries({ queryKey: contactKeys.all })
    },
  })
}
