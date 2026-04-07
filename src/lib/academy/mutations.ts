import { supabase } from '@/lib/supabase'
import type { ObjectionInsert, ObjectionUpdate, AcademyContentInsert, AcademyContentUpdate } from './types'

// ─── Objections ───────────────────────────────────────────────

export async function createObjection(data: ObjectionInsert): Promise<void> {
  const { error } = await supabase.from('nmm_objections').insert(data)
  if (error) throw error
}

export async function updateObjection(id: string, data: ObjectionUpdate): Promise<void> {
  const { error } = await supabase
    .from('nmm_objections')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteObjection(id: string): Promise<void> {
  const { error } = await supabase.from('nmm_objections').delete().eq('id', id)
  if (error) throw error
}

export async function toggleObjectionFavorite(id: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase
    .from('nmm_objections')
    .update({ is_favorite: isFavorite })
    .eq('id', id)
  if (error) throw error
}

export async function incrementObjectionUseCount(id: string): Promise<void> {
  const { data } = await supabase.from('nmm_objections').select('use_count').eq('id', id).single()
  if (data) {
    await supabase.from('nmm_objections').update({ use_count: (data.use_count ?? 0) + 1 }).eq('id', id)
  }
}

// ─── Academy content ──────────────────────────────────────────

export async function createAcademyContent(data: AcademyContentInsert): Promise<void> {
  const { error } = await supabase.from('nmm_academy_content').insert(data)
  if (error) throw error
}

export async function updateAcademyContent(id: string, data: AcademyContentUpdate): Promise<void> {
  const { error } = await supabase
    .from('nmm_academy_content')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteAcademyContent(id: string): Promise<void> {
  const { error } = await supabase.from('nmm_academy_content').delete().eq('id', id)
  if (error) throw error
}

export async function incrementContentViewCount(id: string): Promise<void> {
  const { data } = await supabase.from('nmm_academy_content').select('view_count').eq('id', id).single()
  if (data) {
    await supabase.from('nmm_academy_content').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', id)
  }
}
