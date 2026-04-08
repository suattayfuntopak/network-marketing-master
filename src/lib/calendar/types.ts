// ─── Appointment ──────────────────────────────────────────────

export type AppointmentType = 'meeting' | 'call' | 'video_call' | 'presentation' | 'coffee' | 'event' | 'other'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export interface Appointment {
  id: string
  user_id: string
  contact_id: string | null
  deal_id: string | null
  title: string
  description: string | null
  type: AppointmentType
  location: string | null
  meeting_url: string | null
  starts_at: string
  ends_at: string
  all_day: boolean
  timezone: string
  status: AppointmentStatus
  outcome: string | null
  outcome_notes: string | null
  reminder_minutes: number[]
  created_at: string
  updated_at: string
}

export interface AppointmentInsert {
  user_id: string
  contact_id?: string | null
  deal_id?: string | null
  title: string
  description?: string | null
  type?: AppointmentType
  location?: string | null
  meeting_url?: string | null
  starts_at: string
  ends_at: string
  all_day?: boolean
  timezone?: string
  status?: AppointmentStatus
  reminder_minutes?: number[]
}

export interface AppointmentUpdate {
  contact_id?: string | null
  deal_id?: string | null
  title?: string
  description?: string | null
  type?: AppointmentType
  location?: string | null
  meeting_url?: string | null
  starts_at?: string
  ends_at?: string
  all_day?: boolean
  status?: AppointmentStatus
  outcome?: string | null
  outcome_notes?: string | null
  reminder_minutes?: number[]
}

export interface AppointmentWithContact extends Appointment {
  contact: { id: string; full_name: string; phone: string | null } | null
}

// ─── Follow-up ────────────────────────────────────────────────

export type FollowUpActionType = 'call' | 'message' | 'email' | 'visit' | 'send_info' | 'check_in' | 'other'
export type FollowUpPriority = 'low' | 'medium' | 'high' | 'urgent'
export type FollowUpStatus = 'pending' | 'completed' | 'snoozed' | 'cancelled'

export interface FollowUp {
  id: string
  user_id: string
  contact_id: string
  deal_id: string | null
  title: string
  notes: string | null
  action_type: FollowUpActionType
  priority: FollowUpPriority
  due_at: string
  status: FollowUpStatus
  completed_at: string | null
  snoozed_until: string | null
  auto_generated: boolean
  source: string | null
  created_at: string
  updated_at: string
}

export interface FollowUpInsert {
  user_id: string
  contact_id: string
  deal_id?: string | null
  title: string
  notes?: string | null
  action_type?: FollowUpActionType
  priority?: FollowUpPriority
  due_at: string
  auto_generated?: boolean
  source?: string | null
}

export interface FollowUpUpdate {
  title?: string
  notes?: string | null
  action_type?: FollowUpActionType
  priority?: FollowUpPriority
  due_at?: string
  status?: FollowUpStatus
  completed_at?: string | null
  snoozed_until?: string | null
}

export interface FollowUpWithContact extends FollowUp {
  contact: { id: string; full_name: string; phone: string | null; stage: string }
}

export interface FollowUpBuckets {
  all: FollowUpWithContact[]
  today: FollowUpWithContact[]
  tomorrow: FollowUpWithContact[]
  thisWeek: FollowUpWithContact[]
  overdue: FollowUpWithContact[]
  completed: FollowUpWithContact[]
}

// ─── Calendar view types ──────────────────────────────────────

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  appointments: AppointmentWithContact[]
  followUps: FollowUpWithContact[]
}
