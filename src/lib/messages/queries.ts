import { supabase } from '@/lib/supabase'
import type { MessageTemplate, AIMessage, TemplateFilters } from './types'

// ─── Templates ────────────────────────────────────────────────

export async function fetchTemplates(userId: string, filters?: TemplateFilters): Promise<MessageTemplate[]> {
  let query = supabase
    .from('nmm_message_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.channel) query = query.eq('channel', filters.channel)
  if (filters?.tone) query = query.eq('tone', filters.tone)
  if (filters?.favoritesOnly) query = query.eq('is_favorite', true)
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return data as MessageTemplate[]
}

export async function fetchTemplate(id: string): Promise<MessageTemplate | null> {
  const { data, error } = await supabase
    .from('nmm_message_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as MessageTemplate
}

// ─── AI Messages ──────────────────────────────────────────────

export async function fetchAIMessages(userId: string, contactId?: string): Promise<AIMessage[]> {
  let query = supabase
    .from('nmm_ai_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (contactId) query = query.eq('contact_id', contactId)

  const { data, error } = await query
  if (error) throw error
  return data as AIMessage[]
}
