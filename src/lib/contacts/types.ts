import type { Contact, Tag, Interaction } from '@/types/database'

export type { Contact, Tag, Interaction }

export interface ContactWithTags extends Contact {
  tags: Tag[]
}

export interface ContactFilters {
  search: string
  stages: string[]
  tagIds: string[]
  warmthMin: number
  warmthMax: number
  sources: string[]
  contactTypes: string[]
  pendingFollowUp: boolean
  archived: boolean
}

export const DEFAULT_FILTERS: ContactFilters = {
  search: '',
  stages: [],
  tagIds: [],
  warmthMin: 0,
  warmthMax: 100,
  sources: [],
  contactTypes: [],
  pendingFollowUp: false,
  archived: false,
}

export type SortField = 'full_name' | 'last_contact_at' | 'warmth_score' | 'created_at'
export type SortOrder = 'asc' | 'desc'

export interface ContactSort {
  field: SortField
  order: SortOrder
}

export const DEFAULT_SORT: ContactSort = {
  field: 'created_at',
  order: 'desc',
}

export interface ContactListParams {
  filters: ContactFilters
  sort: ContactSort
  page: number
  pageSize: number
  userId: string
}

export interface ContactListResult {
  data: ContactWithTags[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export type InteractionType = Interaction['type']

export interface AddInteractionParams {
  contactId: string
  userId: string
  type: InteractionType
  content?: string
  subject?: string
  direction?: 'inbound' | 'outbound'
  warmthImpact?: number
  occurredAt?: string
}
