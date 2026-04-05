import { supabase } from '@/lib/supabase'
import type { ContactInsert, ContactUpdate, TagInsert } from '@/types/database'
import type { AddInteractionParams } from './types'

// ─── Contacts ─────────────────────────────────────────────────

export async function createContact(data: ContactInsert): Promise<string> {
  const { data: result, error } = await supabase
    .from('nmm_contacts')
    .insert(data)
    .select('id')
    .single()

  if (error) throw error
  return result.id
}

export async function updateContact(id: string, data: ContactUpdate): Promise<void> {
  const { error } = await supabase
    .from('nmm_contacts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('nmm_contacts').delete().eq('id', id)
  if (error) throw error
}

export async function archiveContact(id: string, archived: boolean): Promise<void> {
  await updateContact(id, { is_archived: archived })
}

export async function bulkUpdateStage(ids: string[], stage: string): Promise<void> {
  const { error } = await supabase
    .from('nmm_contacts')
    .update({ stage: stage as ContactUpdate['stage'], updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) throw error
}

export async function bulkArchive(ids: string[], archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('nmm_contacts')
    .update({ is_archived: archived, updated_at: new Date().toISOString() })
    .in('id', ids)

  if (error) throw error
}

export async function bulkDelete(ids: string[]): Promise<void> {
  const { error } = await supabase.from('nmm_contacts').delete().in('id', ids)
  if (error) throw error
}

// ─── Tags ─────────────────────────────────────────────────────

export async function createTag(data: TagInsert): Promise<string> {
  const { data: result, error } = await supabase
    .from('nmm_tags')
    .insert(data)
    .select('id')
    .single()

  if (error) throw error
  return result.id
}

export async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase.from('nmm_tags').delete().eq('id', id)
  if (error) throw error
}

export async function addTagToContact(contactId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('nmm_contact_tags')
    .insert({ contact_id: contactId, tag_id: tagId })

  if (error && !error.message.includes('duplicate')) throw error
}

export async function removeTagFromContact(contactId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('nmm_contact_tags')
    .delete()
    .eq('contact_id', contactId)
    .eq('tag_id', tagId)

  if (error) throw error
}

export async function setContactTags(contactId: string, tagIds: string[]): Promise<void> {
  // Delete all existing, then insert new ones
  const { error: delError } = await supabase
    .from('nmm_contact_tags')
    .delete()
    .eq('contact_id', contactId)

  if (delError) throw delError

  if (tagIds.length === 0) return

  const rows = tagIds.map((tagId) => ({ contact_id: contactId, tag_id: tagId }))
  const { error } = await supabase.from('nmm_contact_tags').insert(rows)
  if (error) throw error
}

export async function bulkAddTag(contactIds: string[], tagId: string): Promise<void> {
  const rows = contactIds.map((id) => ({ contact_id: id, tag_id: tagId }))
  const { error } = await supabase.from('nmm_contact_tags').upsert(rows, { onConflict: 'contact_id,tag_id' })
  if (error) throw error
}

export async function bulkRemoveTag(contactIds: string[], tagId: string): Promise<void> {
  const { error } = await supabase
    .from('nmm_contact_tags')
    .delete()
    .in('contact_id', contactIds)
    .eq('tag_id', tagId)

  if (error) throw error
}

// ─── Interactions ──────────────────────────────────────────────

export async function addInteraction(params: AddInteractionParams): Promise<void> {
  const { error } = await supabase.from('nmm_interactions').insert({
    contact_id: params.contactId,
    user_id: params.userId,
    type: params.type,
    content: params.content,
    subject: params.subject,
    direction: params.direction,
    warmth_impact: params.warmthImpact ?? 0,
    occurred_at: params.occurredAt ?? new Date().toISOString(),
  })

  if (error) throw error
}

export async function updateContactStage(
  contactId: string,
  userId: string,
  newStage: string,
  oldStage: string
): Promise<void> {
  await updateContact(contactId, { stage: newStage as ContactUpdate['stage'] })
  await addInteraction({
    contactId,
    userId,
    type: 'stage_change',
    subject: null,                      // rendered from i18n key in component
    content: `${oldStage} → ${newStage}`,  // stage slugs, translated in component
    warmthImpact: 0,
  })
}

// ─── CSV Import ────────────────────────────────────────────────

export async function importContacts(
  rows: ContactInsert[]
): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = []
  let inserted = 0

  // Insert in batches of 50
  const batches: ContactInsert[][] = []
  for (let i = 0; i < rows.length; i += 50) {
    batches.push(rows.slice(i, i + 50))
  }

  for (const batch of batches) {
    const { data, error } = await supabase.from('nmm_contacts').insert(batch).select('id')
    if (error) {
      errors.push(error.message)
    } else {
      inserted += data?.length ?? 0
    }
  }

  return { inserted, errors }
}
