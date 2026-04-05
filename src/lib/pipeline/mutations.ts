import { supabase } from '@/lib/supabase'
import type { PipelineStageInsert, PipelineStageUpdate, DealInsert, DealUpdate } from './types'

// ─── Pipeline Stages ──────────────────────────────────────────

export async function createStage(data: PipelineStageInsert): Promise<string> {
  const { data: result, error } = await supabase
    .from('nmm_pipeline_stages')
    .insert(data)
    .select('id')
    .single()

  if (error) throw error
  return result.id
}

export async function updateStage(id: string, data: PipelineStageUpdate): Promise<void> {
  const { error } = await supabase
    .from('nmm_pipeline_stages')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteStage(id: string): Promise<void> {
  const { error } = await supabase
    .from('nmm_pipeline_stages')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function reorderStages(stages: Array<{ id: string; position: number }>): Promise<void> {
  // Update positions in parallel
  await Promise.all(
    stages.map(({ id, position }) =>
      supabase
        .from('nmm_pipeline_stages')
        .update({ position, updated_at: new Date().toISOString() })
        .eq('id', id)
    )
  )
}

// ─── Deals ────────────────────────────────────────────────────

export async function createDeal(data: DealInsert): Promise<string> {
  const { data: result, error } = await supabase
    .from('nmm_deals')
    .insert(data)
    .select('id')
    .single()

  if (error) throw error
  return result.id
}

export async function updateDeal(id: string, data: DealUpdate): Promise<void> {
  const { error } = await supabase
    .from('nmm_deals')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function deleteDeal(id: string): Promise<void> {
  const { error } = await supabase
    .from('nmm_deals')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function moveDealToStage(
  dealId: string,
  stageId: string,
  positionInStage: number
): Promise<void> {
  const { error } = await supabase
    .from('nmm_deals')
    .update({
      stage_id: stageId,
      position_in_stage: positionInStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)

  if (error) throw error
}

export async function closeDeal(
  dealId: string,
  status: 'won' | 'lost',
  lostReason?: string
): Promise<void> {
  const { error } = await supabase
    .from('nmm_deals')
    .update({
      status,
      actual_close_date: new Date().toISOString().split('T')[0],
      lost_reason: lostReason ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)

  if (error) throw error
}

export async function reopenDeal(dealId: string): Promise<void> {
  const { error } = await supabase
    .from('nmm_deals')
    .update({
      status: 'open',
      actual_close_date: null,
      lost_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)

  if (error) throw error
}
