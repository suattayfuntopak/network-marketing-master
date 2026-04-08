import type { StageColor } from './constants'

// ─── Database row types ───────────────────────────────────────

export interface PipelineStage {
  id: string
  user_id: string
  name: string
  slug: string
  description: string | null
  color: StageColor
  icon: string | null
  position: number
  win_probability: number
  is_system: boolean
  is_won_stage: boolean
  is_lost_stage: boolean
  created_at: string
  updated_at: string
}

export interface PipelineStageInsert {
  user_id: string
  name: string
  slug: string
  description?: string | null
  color?: StageColor
  icon?: string | null
  position: number
  win_probability?: number
  is_system?: boolean
  is_won_stage?: boolean
  is_lost_stage?: boolean
}

export interface PipelineStageUpdate {
  name?: string
  slug?: string
  description?: string | null
  color?: StageColor
  icon?: string | null
  position?: number
  win_probability?: number
  is_won_stage?: boolean
  is_lost_stage?: boolean
}

export type DealType = 'prospect' | 'product_sale' | 'recruitment'
export type DealStatus = 'open' | 'won' | 'lost'

export interface Deal {
  id: string
  user_id: string
  contact_id: string
  stage_id: string
  title: string
  deal_type: DealType
  value: number
  currency: string
  probability: number
  expected_close_date: string | null
  actual_close_date: string | null
  status: DealStatus
  lost_reason: string | null
  notes: string | null
  position_in_stage: number
  created_at: string
  updated_at: string
}

export interface DealInsert {
  user_id: string
  contact_id: string
  stage_id: string
  title: string
  deal_type?: DealType
  value?: number
  currency?: string
  probability?: number
  expected_close_date?: string | null
  actual_close_date?: string | null
  status?: DealStatus
  lost_reason?: string | null
  notes?: string | null
  position_in_stage?: number
}

export interface DealUpdate {
  contact_id?: string
  stage_id?: string
  title?: string
  deal_type?: DealType
  value?: number
  currency?: string
  probability?: number
  expected_close_date?: string | null
  actual_close_date?: string | null
  status?: DealStatus
  lost_reason?: string | null
  notes?: string | null
  position_in_stage?: number
}

export interface StageHistory {
  id: string
  deal_id: string
  user_id: string
  from_stage_id: string | null
  to_stage_id: string
  duration_in_stage: string | null
  moved_at: string
}

export interface StageReference {
  name: string
  slug: string
  description: string | null
  color: string
}

// ─── Enriched / view types ────────────────────────────────────

export interface DealContact {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  stage: string
}

export interface DealWithContact extends Deal {
  contact: DealContact
}

export interface StageWithDeals extends PipelineStage {
  deals: DealWithContact[]
  totalValue: number
  weightedValue: number
}

// ─── Filter / query params ────────────────────────────────────

export interface DealFilters {
  dealType?: DealType | null
  status?: DealStatus | null
  stageId?: string | null
}
