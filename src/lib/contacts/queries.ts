import { endOfWeek, startOfWeek } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type {
  ContactListParams,
  ContactListResult,
  ContactWithTags,
  Contact,
  ContactInsight,
  ContactInsightQueryParams,
  MessageContact,
  MessageContactQueryParams,
  ProcessContact,
  ProcessContactQueryParams,
} from './types'
import type { Tag, Interaction } from '@/types/database'

export type ContactSummaryKey = 'all' | 'month' | 'week' | 'today'

export interface ContactSummaryCounts {
  total: number
  month: number
  week: number
  today: number
}

export interface ContactSummaryRow {
  id: string
  full_name: string
  stage: Contact['stage']
  last_contact_at: string | null
  warmth_score: number
  source: Contact['source']
  created_at: string
}

export interface BirthdayContact {
  id: string
  full_name: string
  birthday: string
  stage: Contact['stage']
  phone: string | null
  whatsapp: string | null
  telegram: string | null
  email: string | null
  instagram: string | null
  occupation: string | null
  city: string | null
  relationship: string | null
  warmth_score: number
  goals: string[] | null
  pain_points: string[] | null
  interests: string[] | null
}

async function fetchContactIdsForTags(tagIds: string[]) {
  const { data, error } = await supabase
    .from('nmm_contact_tags')
    .select('contact_id')
    .in('tag_id', tagIds)

  if (error) throw error

  return [...new Set((data ?? []).map((row) => row.contact_id))]
}

function mapContactRow(row: Record<string, unknown>): ContactWithTags {
  const tags: Tag[] = ((row.nmm_contact_tags as { nmm_tags: Tag }[] | null) ?? [])
    .map((ct) => ct.nmm_tags)
    .filter(Boolean)

  const contactRecord = { ...row }
  delete contactRecord.nmm_contact_tags

  return { ...((contactRecord as unknown) as ContactWithTags), tags }
}

function getSummaryWindowStart(summaryKey: ContactSummaryKey) {
  const now = new Date()

  if (summaryKey === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  if (summaryKey === 'week') return startOfWeek(now, { weekStartsOn: 1 }).toISOString()
  if (summaryKey === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  return null
}

function buildContactCountQuery(
  userId: string,
  contactTypes: Contact['contact_type'][] = [],
  summaryKey: ContactSummaryKey = 'all'
) {
  let query = supabase
    .from('nmm_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_archived', false)

  if (contactTypes.length > 0) {
    query = query.in('contact_type', contactTypes)
  }

  const startDate = getSummaryWindowStart(summaryKey)
  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  return query
}

export async function fetchContacts(params: ContactListParams): Promise<ContactListResult> {
  const { filters, sort, page, pageSize, userId } = params
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const tagFilteredContactIds = filters.tagIds.length > 0
    ? await fetchContactIdsForTags(filters.tagIds)
    : null

  if (tagFilteredContactIds && tagFilteredContactIds.length === 0) {
    return {
      data: [],
      count: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }

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

  if (tagFilteredContactIds) {
    query = query.in('id', tagFilteredContactIds)
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
  const contacts = (data ?? []).map((row: Record<string, unknown>) => mapContactRow(row))

  const totalCount = count ?? 0
  return {
    data: contacts,
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  }
}

export async function fetchContactsForExport(
  params: Omit<ContactListParams, 'page' | 'pageSize'> & { batchSize?: number }
): Promise<ContactWithTags[]> {
  const batchSize = params.batchSize ?? 250
  let page = 1
  let totalPages = 1
  const allContacts: ContactWithTags[] = []

  do {
    const result = await fetchContacts({
      ...params,
      page,
      pageSize: batchSize,
    })

    allContacts.push(...result.data)
    totalPages = result.totalPages
    page += 1

    if (result.data.length === 0) break
  } while (page <= totalPages)

  return allContacts
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

  return mapContactRow(rawData)
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

export async function fetchContactSummaryCounts(
  userId: string,
  contactTypes: Contact['contact_type'][] = []
): Promise<ContactSummaryCounts> {
  const [totalResult, monthResult, weekResult, todayResult] = await Promise.all([
    buildContactCountQuery(userId, contactTypes, 'all'),
    buildContactCountQuery(userId, contactTypes, 'month'),
    buildContactCountQuery(userId, contactTypes, 'week'),
    buildContactCountQuery(userId, contactTypes, 'today'),
  ])

  if (totalResult.error) throw totalResult.error
  if (monthResult.error) throw monthResult.error
  if (weekResult.error) throw weekResult.error
  if (todayResult.error) throw todayResult.error

  return {
    total: totalResult.count ?? 0,
    month: monthResult.count ?? 0,
    week: weekResult.count ?? 0,
    today: todayResult.count ?? 0,
  }
}

export async function fetchContactsCreatedThisWeekCount(userId: string): Promise<number> {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const { count, error } = await supabase
    .from('nmm_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_archived', false)
    .gte('created_at', weekStart.toISOString())
    .lte('created_at', weekEnd.toISOString())

  if (error) throw error
  return count ?? 0
}

export async function fetchContactsWithBirthdayToday(userId: string): Promise<BirthdayContact[]> {
  const today = new Date()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()

  const { data, error } = await supabase
    .from('nmm_contacts')
    .select('id, full_name, birthday, stage, phone, whatsapp, telegram, email, instagram, occupation, city, relationship, warmth_score, goals, pain_points, interests')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .not('birthday', 'is', null)
    .order('full_name', { ascending: true })

  if (error) throw error

  return (data ?? []).filter((contact) => {
    if (!contact.birthday) return false
    const birthday = new Date(contact.birthday)

    return !Number.isNaN(birthday.getTime())
      && birthday.getMonth() === todayMonth
      && birthday.getDate() === todayDate
  }) as BirthdayContact[]
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

  return (data ?? []).map((row: Record<string, unknown>) => mapContactRow(row))
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

  return (data ?? []).map((row: Record<string, unknown>) => mapContactRow(row))
}

export async function fetchContactSummaryRows(
  userId: string,
  summaryKey: ContactSummaryKey,
  contactTypes: Contact['contact_type'][] = []
): Promise<ContactSummaryRow[]> {
  let query = supabase
    .from('nmm_contacts')
    .select('id, full_name, stage, last_contact_at, warmth_score, source, created_at')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (contactTypes.length > 0) {
    query = query.in('contact_type', contactTypes)
  }

  const startDate = getSummaryWindowStart(summaryKey)
  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []) as ContactSummaryRow[]
}

export async function fetchContactInsights({
  userId,
  contactTypes = [],
  limit = 250,
}: ContactInsightQueryParams): Promise<ContactInsight[]> {
  let query = supabase
    .from('nmm_contacts')
    .select('id, full_name, city, occupation, warmth_score, stage, created_at, last_contact_at, next_follow_up_at, contact_type')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('warmth_score', { ascending: false })
    .limit(limit)

  if (contactTypes.length > 0) {
    query = query.in('contact_type', contactTypes)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []) as ContactInsight[]
}

export async function fetchMessageContacts({
  userId,
  search = '',
  limit = 100,
}: MessageContactQueryParams): Promise<MessageContact[]> {
  let query = supabase
    .from('nmm_contacts')
    .select('id, full_name, occupation, city, relationship, goals, pain_points, interests, warmth_score, stage, phone, whatsapp, telegram, email, instagram, created_at, last_contact_at, next_follow_up_at, contact_type')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('warmth_score', { ascending: false })
    .limit(limit)

  if (search.trim()) {
    const searchValue = `%${search.trim()}%`
    query = query.or(
      `full_name.ilike.${searchValue},occupation.ilike.${searchValue},phone.ilike.${searchValue},whatsapp.ilike.${searchValue},email.ilike.${searchValue}`
    )
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []) as MessageContact[]
}

export async function fetchProcessContacts({
  userId,
  limit = 500,
}: ProcessContactQueryParams): Promise<ProcessContact[]> {
  const { data, error } = await supabase
    .from('nmm_contacts')
    .select('id, full_name, city, occupation, warmth_score, stage, last_contact_at, next_follow_up_at, contact_type, phone, whatsapp, telegram, email, instagram, nmm_contact_tags(tag_id)')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .neq('contact_type', 'customer')
    .order('warmth_score', { ascending: false })
    .limit(limit)

  if (error) throw error

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    full_name: row.full_name as string,
    city: (row.city as string | null) ?? null,
    occupation: (row.occupation as string | null) ?? null,
    warmth_score: row.warmth_score as number,
    stage: row.stage as Contact['stage'],
    last_contact_at: (row.last_contact_at as string | null) ?? null,
    next_follow_up_at: (row.next_follow_up_at as string | null) ?? null,
    contact_type: row.contact_type as Contact['contact_type'],
    phone: (row.phone as string | null) ?? null,
    whatsapp: (row.whatsapp as string | null) ?? null,
    telegram: (row.telegram as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    instagram: (row.instagram as string | null) ?? null,
    tagCount: ((row.nmm_contact_tags as Array<{ tag_id: string }> | null) ?? []).length,
  }))
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
