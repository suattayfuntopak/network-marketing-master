import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchContact } from '@/lib/contacts/queries'
import {
  createContact,
  updateContact,
  deleteContact,
  archiveContact,
  updateContactStage,
  setContactTags,
} from '@/lib/contacts/mutations'
import type { ContactInsert, ContactUpdate } from '@/types/database'
import { contactKeys } from './useContacts'
import { interactionKeys } from './useInteractions'
import { tagKeys } from './useTags'

export function useContact(id: string | undefined) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => fetchContact(id!),
    enabled: !!id,
    retry: 1,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ContactInsert) => createContact(data),
    onSuccess: (newId) => {
      console.debug('[useCreateContact] onSuccess, invalidating contacts. newId:', newId)
      qc.invalidateQueries({ queryKey: contactKeys.all })
    },
    onError: (err) => {
      console.error('[useCreateContact] Mutation error:', err)
    },
  })
}

export function useUpdateContact(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ContactUpdate) => updateContact(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all })
      qc.invalidateQueries({ queryKey: ['contact', id] })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all })
    },
  })
}

export function useArchiveContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      archiveContact(id, archived),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all })
    },
  })
}

// Dynamic version — contactId passed in mutate call
export function useUpdateContactStageById(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contactId, newStage, oldStage }: { contactId: string; newStage: string; oldStage: string }) =>
      updateContactStage(contactId, userId, newStage, oldStage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all })
    },
  })
}

export function useUpdateContactStage(contactId: string, userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ newStage, oldStage }: { newStage: string; oldStage: string }) =>
      updateContactStage(contactId, userId, newStage, oldStage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: contactKeys.all })
      qc.invalidateQueries({ queryKey: ['contact', contactId] })
      qc.invalidateQueries({ queryKey: interactionKeys.list(contactId) })
    },
  })
}

export function useSetContactTags(contactId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tagIds: string[]) => setContactTags(contactId, tagIds),
    onSuccess: (_, tagIds) => {
      qc.invalidateQueries({ queryKey: contactKeys.all })
      qc.invalidateQueries({ queryKey: ['contact', contactId] })
      qc.invalidateQueries({ queryKey: tagKeys.all })
    },
  })
}
