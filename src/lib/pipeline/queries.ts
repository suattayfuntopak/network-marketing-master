import { supabase } from '@/lib/supabase'
import type { PipelineStage, Deal, DealWithContact, StageHistory, DealFilters } from './types'

// ─── Pipeline Stages ──────────────────────────────────────────

export async function fetchPipelineStages(userId: string): Promise<PipelineStage[]> {
  const { data, error } = await supabase
    .from('nmm_pipeline_stages')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })

  if (error) throw error
  return data as PipelineStage[]
}

// ─── Deals ────────────────────────────────────────────────────

export async function fetchDeals(userId: string, filters?: DealFilters): Promise<DealWithContact[]> {
  let query = supabase
    .from('nmm_deals')
    .select(`
      *,
      contact:nmm_contacts(id, full_name, phone, email, stage)
    `)
    .eq('user_id', userId)
    .order('position_in_stage', { ascending: true })
    .order('created_at', { ascending: false })

  if (filters?.dealType) query = query.eq('deal_type', filters.dealType)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.stageId) query = query.eq('stage_id', filters.stageId)

  const { data, error } = await query
  if (error) throw error
  return data as DealWithContact[]
}

export async function fetchDeal(dealId: string): Promise<DealWithContact | null> {
  const { data, error } = await supabase
    .from('nmm_deals')
    .select(`
      *,
      contact:nmm_contacts(id, full_name, phone, email, stage)
    `)
    .eq('id', dealId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as DealWithContact
}

export async function fetchDealsByContact(contactId: string, userId: string): Promise<Deal[]> {
  const { data, error } = await supabase
    .from('nmm_deals')
    .select('*')
    .eq('contact_id', contactId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Deal[]
}

export async function fetchStageHistory(dealId: string): Promise<(StageHistory & { from_stage: { name: string; color: string } | null; to_stage: { name: string; color: string } })[]> {
  const { data, error } = await supabase
    .from('nmm_stage_history')
    .select(`
      *,
      from_stage:nmm_pipeline_stages!from_stage_id(name, color),
      to_stage:nmm_pipeline_stages!to_stage_id(name, color)
    `)
    .eq('deal_id', dealId)
    .order('moved_at', { ascending: false })

  if (error) throw error
  return data as (StageHistory & { from_stage: { name: string; color: string } | null; to_stage: { name: string; color: string } })[]
}

// ─── Pipeline stats ───────────────────────────────────────────

export async function fetchPipelineStats(userId: string): Promise<{ totalDeals: number; totalValue: number; weightedValue: number }> {
  const { data, error } = await supabase
    .from('nmm_deals')
    .select('value, probability, status')
    .eq('user_id', userId)
    .eq('status', 'open')

  if (error) throw error

  const totalDeals = data.length
  const totalValue = data.reduce((sum, d) => sum + (d.value ?? 0), 0)
  const weightedValue = data.reduce((sum, d) => sum + ((d.value ?? 0) * (d.probability ?? 0)) / 100, 0)

  return { totalDeals, totalValue, weightedValue }
}
