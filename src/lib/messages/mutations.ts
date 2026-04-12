import { supabase } from '@/lib/supabase'
import type { MessageTemplateInsert, MessageTemplateUpdate, AIMessageInsert, AIMessageUpdate } from './types'
import type { Json } from '@/types/database'

// ─── Templates ────────────────────────────────────────────────

export async function createTemplate(data: MessageTemplateInsert): Promise<void> {
  const { error } = await supabase.from('nmm_message_templates').insert(data)
  if (error) throw error
}

export async function updateTemplate(id: string, data: MessageTemplateUpdate): Promise<void> {
  const { error } = await supabase
    .from('nmm_message_templates')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('nmm_message_templates').delete().eq('id', id)
  if (error) throw error
}

export async function toggleTemplateFavorite(id: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase
    .from('nmm_message_templates')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
  if (error) throw error
}

export async function incrementTemplateUseCount(id: string): Promise<void> {
  const { error } = await supabase.rpc('increment_template_use_count', { template_id: id }).throwOnError()
  // Fallback to manual increment if RPC not available
  if (error) {
    const { data } = await supabase.from('nmm_message_templates').select('use_count').eq('id', id).single()
    if (data) {
      await supabase.from('nmm_message_templates').update({ use_count: (data.use_count ?? 0) + 1 }).eq('id', id)
    }
  }
}

// ─── AI Messages ──────────────────────────────────────────────

export async function saveAIMessage(data: AIMessageInsert): Promise<string> {
  const payload = {
    ...data,
    context: (data.context ?? {}) as Json,
    variants: (data.variants ?? null) as Json,
  }
  const { data: row, error } = await supabase
    .from('nmm_ai_messages')
    .insert(payload)
    .select('id')
    .single()
  if (error) throw error
  return row.id as string
}

export async function markAIMessageUsed(id: string, finalContent?: string): Promise<void> {
  const { error } = await supabase
    .from('nmm_ai_messages')
    .update({
      was_used: true,
      was_edited: !!finalContent,
      final_content: finalContent ?? null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function rateAIMessage(id: string, feedback: 'great' | 'good' | 'meh' | 'bad'): Promise<void> {
  const { error } = await supabase
    .from('nmm_ai_messages')
    .update({ feedback })
    .eq('id', id)
  if (error) throw error
}

export async function updateAIMessage(id: string, data: AIMessageUpdate): Promise<void> {
  const { error } = await supabase
    .from('nmm_ai_messages')
    .update(data)
    .eq('id', id)
  if (error) throw error
}

export async function deleteAIMessage(id: string): Promise<void> {
  const { error } = await supabase
    .from('nmm_ai_messages')
    .delete()
    .eq('id', id)
  if (error) throw error
}
