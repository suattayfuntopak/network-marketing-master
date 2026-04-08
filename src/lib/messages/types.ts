// ─── Enums / literals ─────────────────────────────────────────

export type MessageCategory =
  | 'first_contact'
  | 'warm_up'
  | 'value_share'
  | 'invitation'
  | 'follow_up'
  | 'objection_handling'
  | 'closing'
  | 'after_no'
  | 'reactivation'
  | 'birthday'
  | 'thank_you'
  | 'onboarding'

export type MessageChannel = 'whatsapp' | 'telegram' | 'sms' | 'email' | 'instagram_dm' | 'any'

export type MessageTone =
  | 'friendly'
  | 'professional'
  | 'curious'
  | 'empathetic'
  | 'confident'
  | 'humorous'

export type AIFeedback = 'great' | 'good' | 'meh' | 'bad'

// ─── Templates ────────────────────────────────────────────────

export interface MessageTemplate {
  id: string
  user_id: string
  name: string
  category: MessageCategory
  channel: MessageChannel
  tone: MessageTone
  language: string
  content: string
  variables: string[] | null
  goal: string | null
  use_case: string | null
  is_ai_generated: boolean
  is_favorite: boolean
  is_shared: boolean
  use_count: number
  success_count: number
  created_at: string
  updated_at: string
}

export interface MessageTemplateInsert {
  user_id: string
  name: string
  category: MessageCategory
  channel?: MessageChannel
  tone?: MessageTone
  language?: string
  content: string
  variables?: string[] | null
  goal?: string | null
  use_case?: string | null
  is_ai_generated?: boolean
  is_shared?: boolean
}

export interface MessageTemplateUpdate {
  name?: string
  category?: MessageCategory
  channel?: MessageChannel
  tone?: MessageTone
  content?: string
  variables?: string[] | null
  goal?: string | null
  use_case?: string | null
  is_favorite?: boolean
  is_shared?: boolean
}

// ─── AI Messages ──────────────────────────────────────────────

export interface AIMessageVariant {
  approach: string
  message: string
}

export interface AIMessage {
  id: string
  user_id: string
  contact_id: string | null
  prompt: string
  context: Record<string, unknown>
  category: MessageCategory
  channel: MessageChannel
  tone: MessageTone
  language: string
  generated_content: string
  variants: AIMessageVariant[] | null
  was_used: boolean
  was_edited: boolean
  final_content: string | null
  feedback: AIFeedback | null
  tokens_used: number | null
  model: string
  created_at: string
}

export interface AIMessageInsert {
  user_id: string
  contact_id?: string | null
  prompt: string
  context?: Record<string, unknown>
  category: MessageCategory
  channel: MessageChannel
  tone: MessageTone
  language?: string
  generated_content: string
  variants?: AIMessageVariant[] | null
  tokens_used?: number | null
  model?: string
}

export interface AIMessageUpdate {
  generated_content?: string
  final_content?: string | null
  was_edited?: boolean
  was_used?: boolean
  feedback?: AIFeedback | null
}

// ─── AI Generation request ────────────────────────────────────

export interface GenerateMessageRequest {
  contactId?: string
  contactSnapshot?: {
    full_name: string
    occupation?: string | null
    city?: string | null
    relationship?: string | null
    goals?: string[] | null
    pain_points?: string[] | null
    interests?: string[] | null
    warmth_score?: number
    stage?: string
    lastInteractionNote?: string | null
  }
  category: MessageCategory
  channel: MessageChannel
  tone: MessageTone
  userInput?: string
}

export type AIMessageErrorCode =
  | 'missing_config'
  | 'network_error'
  | 'unauthorized'
  | 'forbidden'
  | 'rate_limit'
  | 'invalid_request'
  | 'function_runtime_error'
  | 'unknown_error'

export interface AIMessageErrorResponse {
  code: AIMessageErrorCode
  message: string
  details?: string
}

export interface GenerateMessageResponse {
  variants: AIMessageVariant[]
  tokensUsed?: number
}

// ─── Template filters ─────────────────────────────────────────

export interface TemplateFilters {
  category?: MessageCategory | null
  channel?: MessageChannel | null
  tone?: MessageTone | null
  search?: string
  favoritesOnly?: boolean
}
