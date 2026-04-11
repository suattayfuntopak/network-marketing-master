import { supabase } from '@/lib/supabase'
import i18n from '@/i18n'
import type { Objection, ObjectionFilters, AcademyContent, AcademyFilters } from './types'
import {
  getSystemAcademyContent,
  getSystemAcademyContents,
  getSystemObjection,
  getSystemObjections,
  isSystemAcademyId,
  isSystemObjectionId,
} from './systemContent'

const LEVEL_ORDER = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
} as const

function getCurrentLanguage() {
  return i18n.language?.startsWith('en') ? 'en' : 'tr'
}

function normalizeObjectionTitle(text: string) {
  const trimmed = text.trim()
  const stripped = trimmed.replace(/^[^:]{1,60}:\s*/, '').trim()

  if (!stripped) return trimmed
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}

function normalizeObjection(item: Objection): Objection {
  return {
    ...item,
    objection_text: normalizeObjectionTitle(item.objection_text),
  }
}

function dedupeObjections(items: Objection[]) {
  const unique = new Map<string, Objection>()

  items.forEach((item) => {
    const normalized = normalizeObjection(item)
    const key = `${normalized.category}:${normalized.objection_text.trim().toLocaleLowerCase()}`

    if (!unique.has(key)) {
      unique.set(key, normalized)
    }
  })

  return Array.from(unique.values())
}

function matchesObjectionFilters(item: Objection, filters?: ObjectionFilters) {
  const search = filters?.search?.trim().toLowerCase()

  if (filters?.category && item.category !== filters.category) return false
  if (filters?.favoritesOnly && !item.is_favorite) return false
  if (!search) return true

  const haystack = [
    item.objection_text,
    item.short_label,
    item.response_text,
    item.response_short,
    item.approach,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(search)
}

function matchesAcademyFilters(item: AcademyContent, filters?: AcademyFilters) {
  const search = filters?.search?.trim().toLowerCase()

  if (filters?.category && item.category !== filters.category) return false
  if (filters?.type && item.type !== filters.type) return false
  if (filters?.level && item.level !== filters.level) return false
  if (filters?.favoritesOnly && !item.is_favorite) return false
  if (!search) return true

  const haystack = [
    item.title,
    item.summary,
    item.content,
    ...(item.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(search)
}

// ─── Objections ───────────────────────────────────────────────

export async function fetchObjections(filters?: ObjectionFilters): Promise<Objection[]> {
  const language = getCurrentLanguage()
  const systemItems = getSystemObjections(language)

  const query = supabase
    .from('nmm_objections')
    .select('*')
    .order('category', { ascending: true })
    .order('created_at', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  const dbItems = ((data as Objection[]) ?? []).filter((item) => !item.language || item.language === language)

  return dedupeObjections([...dbItems, ...systemItems])
    .filter((item) => matchesObjectionFilters(item, filters))
    .sort((a, b) => a.category.localeCompare(b.category) || a.objection_text.localeCompare(b.objection_text))
}

export async function fetchObjection(id: string): Promise<Objection | null> {
  if (isSystemObjectionId(id)) {
    const item = getSystemObjection(id, getCurrentLanguage())
    return item ? normalizeObjection(item) : null
  }

  const { data, error } = await supabase
    .from('nmm_objections')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return normalizeObjection(data as Objection)
}

// ─── Academy content ──────────────────────────────────────────

export async function fetchAcademyContents(filters?: AcademyFilters): Promise<AcademyContent[]> {
  const language = getCurrentLanguage()
  const systemItems = filters?.favoritesOnly ? [] : getSystemAcademyContents(language)

  const query = supabase
    .from('nmm_academy_content')
    .select('*')
    .eq('is_published', true)
    .order('category', { ascending: true })
    .order('level', { ascending: true })
    .order('created_at', { ascending: true })

  const { data, error } = await query
  if (error) throw error

  const dbItems = ((data as AcademyContent[]) ?? []).filter((item) => !item.language || item.language === language)

  return [...dbItems, ...systemItems]
    .filter((item) => matchesAcademyFilters(item, filters))
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) ||
        LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] ||
        a.title.localeCompare(b.title)
    )
}

export async function fetchAcademyContent(id: string): Promise<AcademyContent | null> {
  if (isSystemAcademyId(id)) {
    return getSystemAcademyContent(id, getCurrentLanguage())
  }

  const { data, error } = await supabase
    .from('nmm_academy_content')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as AcademyContent
}
