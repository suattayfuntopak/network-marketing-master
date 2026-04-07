import { supabase } from '@/lib/supabase'
import type { Objection, ObjectionFilters, AcademyContent, AcademyFilters } from './types'

// ─── Objections ───────────────────────────────────────────────

export async function fetchObjections(filters?: ObjectionFilters): Promise<Objection[]> {
  let query = supabase
    .from('nmm_objections')
    .select('*')
    .order('category', { ascending: true })
    .order('created_at', { ascending: true })

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.favoritesOnly) query = query.eq('is_favorite', true)
  if (filters?.search) {
    query = query.or(
      `objection_text.ilike.%${filters.search}%,short_label.ilike.%${filters.search}%,response_text.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data as Objection[]
}

export async function fetchObjection(id: string): Promise<Objection | null> {
  const { data, error } = await supabase
    .from('nmm_objections')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Objection
}

// ─── Academy content ──────────────────────────────────────────

export async function fetchAcademyContents(filters?: AcademyFilters): Promise<AcademyContent[]> {
  let query = supabase
    .from('nmm_academy_content')
    .select('*')
    .eq('is_published', true)
    .order('category', { ascending: true })
    .order('level', { ascending: true })
    .order('created_at', { ascending: true })

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.level) query = query.eq('level', filters.level)
  if (filters?.favoritesOnly) query = query.eq('is_favorite', true)
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as AcademyContent[]
}

export async function fetchAcademyContent(id: string): Promise<AcademyContent | null> {
  const { data, error } = await supabase
    .from('nmm_academy_content')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as AcademyContent
}
