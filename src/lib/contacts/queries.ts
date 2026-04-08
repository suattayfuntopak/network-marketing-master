import { supabase } from '@/lib/supabase'
import type { ContactListParams, ContactListResult, ContactWithTags, Contact } from './types'
import type { Tag, Interaction } from '@/types/database'

export async function fetchContacts(params: ContactListParams): Promise<ContactListResult> {
  const { filters, sort, page, pageSize, userId } = params

  // Note: filters.archived is a boolean. Supabase .eq('is_archived', false) correctly
  // filters for non-archived contacts. When archived=true, it shows archived ones.
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('nmm_contacts')
    .select('*, nmm_contact_tags(tag_id, nmm_tags(*))', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_archived', filters.archived)
    .range(from, to)
    .order(sort.field, { ascending: sort.order === 'asc' })

  if (filters.search) {
    const s = `%${filters.search}%`
    query = query.or(
      `full_name.ilike.${s},nickname.ilike.${s},phone.ilike.${s},whatsapp.ilike.${s},email.ilike.${s},notes.ilike.${s}`
    )
  }

  if (filters.stages.length > 0) {
    query = query.in('stage', filters.stages as Contact['stage'][])
  }

  if (filters.sources.length > 0) {
    query = query.in('source', filters.sources as Contact['source'][])
  }

  if (filters.contactTypes.length > 0) {
    query = query.in('contact_type', filters.contactTypes as Contact['contact_type'][])
  }

  if (filters.warmthMin > 0 || filters.warmthMax < 100) {
    query = query.gte('warmth_score', filters.warmthMin).lte('warmth_score', filters.warmthMax)
  }

  if (filters.pendingFollowUp) {
    query = query.lte('next_follow_up_at', new Date().toISOString()).not('next_follow_up_at', 'is', null)
  }

  const { data, error, count } = await query

  if (error) throw error

  // Flatten tags from nested join
  const contacts: ContactWithTags[] = (data ?? []).map((row: Record<string, unknown>) => {
    const tags: Tag[] = ((row.nmm_contact_tags as { nmm_tags: Tag }[] | null) ?? [])
      .map((ct) => ct.nmm_tags)
      .filter(Boolean)

    const { nmm_contact_tags: _, ...contact } = row
    return { ...(contact as unknown as ContactWithTags), tags }
  })

  // Filter by tagIds after fetch (Supabase doesn't support many-to-many filter well)
  const filtered =
    filters.tagIds.length > 0
      ? contacts.filter((c) => filters.tagIds.some((tid) => c.tags.some((t) => t.id === tid)))
      : contacts

  const totalCount = count ?? 0
  return {
    data: filtered,
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  }
}

export async function fetchContact(id: string): Promise<ContactWithTags | null> {
  const { data, error } = await supabase
    .from('nmm_contacts')
    .select('*, nmm_contact_tags(tag_id, nmm_tags(*))')
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }
  if (!data) return null
  
  const rawData = data as unknown as Record<string, unknown>

  const tags: Tag[] = ((rawData.nmm_contact_tags as { nmm_tags: Tag }[]) ?? [])
    .map((ct) => ct.nmm_tags)
    .filter(Boolean)

  const { nmm_contact_tags: _, ...contact } = rawData
  return { ...(contact as unknown as ContactWithTags), tags }
}

export async function fetchInteractions(contactId: string): Promise<Interaction[]> {
  const { data, error } = await supabase
    .from('nmm_interactions')
    .select('*')
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function fetchTags(userId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('nmm_tags')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function fetchContactCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('nmm_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_archived', false)

  if (error) throw error
  return count ?? 0
}

export async function fetchPendingFollowUps(userId: string): Promise<ContactWithTags[]> {
  const { data, error } = await supabase
    .from('nmm_contacts')
    .select('*, nmm_contact_tags(tag_id, nmm_tags(*))')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .lte('next_follow_up_at', new Date().toISOString())
    .not('next_follow_up_at', 'is', null)
    .order('next_follow_up_at', { ascending: true })
    .limit(5)

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => {
    const tags: Tag[] = ((row.nmm_contact_tags as { nmm_tags: Tag }[] | null) ?? [])
      .map((ct) => ct.nmm_tags)
      .filter(Boolean)
    const { nmm_contact_tags: _, ...contact } = row
    return { ...(contact as unknown as ContactWithTags), tags }
  })
}

export async function fetchRecentContacts(userId: string): Promise<ContactWithTags[]> {
  const { data, error } = await supabase
    .from('nmm_contacts')
    .select('*, nmm_contact_tags(tag_id, nmm_tags(*))')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => {
    const tags: Tag[] = ((row.nmm_contact_tags as { nmm_tags: Tag }[] | null) ?? [])
      .map((ct) => ct.nmm_tags)
      .filter(Boolean)
    const { nmm_contact_tags: _, ...contact } = row
    return { ...(contact as unknown as ContactWithTags), tags }
  })
}


export interface StageCount { stage: string; count: number }

export async function fetchContactStageCounts(userId: string): Promise<StageCount[]> {
  const STAGES = ['new', 'contacted', 'interested', 'presenting', 'thinking', 'joined', 'lost']
  const { data, error } = await supabase
    .from('nmm_contacts')
    .select('stage')
    .eq('user_id', userId)
    .eq('is_archived', false)

  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const stage = row.stage as string
    counts.set(stage, (counts.get(stage) ?? 0) + 1)
  }

  return STAGES.map((stage) => ({ stage, count: counts.get(stage) ?? 0 }))
}
