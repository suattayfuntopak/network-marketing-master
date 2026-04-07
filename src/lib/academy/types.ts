// ─── Objections ───────────────────────────────────────────────

export type ObjectionCategory =
  | 'money'
  | 'time'
  | 'trust'
  | 'family'
  | 'fear'
  | 'experience'
  | 'product'
  | 'company'
  | 'pyramid'
  | 'no_network'
  | 'introvert'
  | 'employed'
  | 'wait'
  | 'other'

export interface Objection {
  id: string
  user_id: string | null
  category: ObjectionCategory
  objection_text: string
  short_label: string | null
  response_text: string
  response_short: string | null
  approach: string | null
  example_dialog: string | null
  video_url: string | null
  reading_url: string | null
  language: string
  is_system: boolean
  is_favorite: boolean
  use_count: number
  tags: string[] | null
  created_at: string
  updated_at: string
}

export interface ObjectionInsert {
  user_id: string
  category: ObjectionCategory
  objection_text: string
  short_label?: string | null
  response_text: string
  response_short?: string | null
  approach?: string | null
  example_dialog?: string | null
  video_url?: string | null
  reading_url?: string | null
  language?: string
  tags?: string[] | null
}

export interface ObjectionUpdate {
  category?: ObjectionCategory
  objection_text?: string
  short_label?: string | null
  response_text?: string
  response_short?: string | null
  approach?: string | null
  example_dialog?: string | null
  video_url?: string | null
  reading_url?: string | null
  is_favorite?: boolean
  tags?: string[] | null
}

export interface ObjectionFilters {
  category?: ObjectionCategory | null
  search?: string
  favoritesOnly?: boolean
}

// ─── Academy content ──────────────────────────────────────────

export type ContentType = 'script' | 'lesson' | 'success_story' | 'video' | 'article' | 'cheat_sheet' | 'role_play'

export type ContentCategory =
  | 'mindset'
  | 'prospecting'
  | 'inviting'
  | 'presenting'
  | 'closing'
  | 'follow_up'
  | 'team_building'
  | 'leadership'
  | 'social_media'
  | 'product_knowledge'
  | 'company_info'
  | 'compliance'

export type ContentLevel = 'beginner' | 'intermediate' | 'advanced'

export interface AcademyContent {
  id: string
  user_id: string | null
  type: ContentType
  category: ContentCategory
  level: ContentLevel
  title: string
  summary: string | null
  content: string | null
  video_url: string | null
  reading_time_minutes: number | null
  tags: string[] | null
  language: string
  is_system: boolean
  is_published: boolean
  is_favorite: boolean
  view_count: number
  created_at: string
  updated_at: string
}

export interface AcademyContentInsert {
  user_id: string
  type: ContentType
  category: ContentCategory
  level?: ContentLevel
  title: string
  summary?: string | null
  content?: string | null
  video_url?: string | null
  reading_time_minutes?: number | null
  tags?: string[] | null
  language?: string
}

export interface AcademyContentUpdate {
  type?: ContentType
  category?: ContentCategory
  level?: ContentLevel
  title?: string
  summary?: string | null
  content?: string | null
  video_url?: string | null
  reading_time_minutes?: number | null
  tags?: string[] | null
  is_favorite?: boolean
  is_published?: boolean
}

export interface AcademyFilters {
  category?: ContentCategory | null
  type?: ContentType | null
  level?: ContentLevel | null
  search?: string
  favoritesOnly?: boolean
}
