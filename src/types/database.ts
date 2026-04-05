export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      nmm_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          company: string | null
          sponsor_name: string | null
          role: 'distributor' | 'leader' | 'admin'
          avatar_url: string | null
          timezone: string
          language: string
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          company?: string | null
          sponsor_name?: string | null
          role?: 'distributor' | 'leader' | 'admin'
          avatar_url?: string | null
          timezone?: string
          language?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          company?: string | null
          sponsor_name?: string | null
          role?: 'distributor' | 'leader' | 'admin'
          avatar_url?: string | null
          timezone?: string
          language?: string
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      nmm_contacts: {
        Row: {
          id: string
          user_id: string
          full_name: string
          nickname: string | null
          phone: string | null
          whatsapp: string | null
          telegram: string | null
          email: string | null
          instagram: string | null
          source: 'manual' | 'referral' | 'social_media' | 'event' | 'cold_outreach' | 'import' | 'other'
          contact_type: 'prospect' | 'customer' | 'distributor' | 'lost'
          relationship: string | null
          city: string | null
          occupation: string | null
          warmth_score: number
          stage: 'new' | 'contacted' | 'interested' | 'presenting' | 'thinking' | 'joined' | 'lost'
          notes: string | null
          birthday: string | null
          children_count: number | null
          interests: string[] | null
          goals: string[] | null
          pain_points: string[] | null
          last_contact_at: string | null
          next_follow_up_at: string | null
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          nickname?: string | null
          phone?: string | null
          whatsapp?: string | null
          telegram?: string | null
          email?: string | null
          instagram?: string | null
          source?: 'manual' | 'referral' | 'social_media' | 'event' | 'cold_outreach' | 'import' | 'other'
          contact_type?: 'prospect' | 'customer' | 'distributor' | 'lost'
          relationship?: string | null
          city?: string | null
          occupation?: string | null
          warmth_score?: number
          stage?: 'new' | 'contacted' | 'interested' | 'presenting' | 'thinking' | 'joined' | 'lost'
          notes?: string | null
          birthday?: string | null
          children_count?: number | null
          interests?: string[] | null
          goals?: string[] | null
          pain_points?: string[] | null
          last_contact_at?: string | null
          next_follow_up_at?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          nickname?: string | null
          phone?: string | null
          whatsapp?: string | null
          telegram?: string | null
          email?: string | null
          instagram?: string | null
          source?: 'manual' | 'referral' | 'social_media' | 'event' | 'cold_outreach' | 'import' | 'other'
          contact_type?: 'prospect' | 'customer' | 'distributor' | 'lost'
          relationship?: string | null
          city?: string | null
          occupation?: string | null
          warmth_score?: number
          stage?: 'new' | 'contacted' | 'interested' | 'presenting' | 'thinking' | 'joined' | 'lost'
          notes?: string | null
          birthday?: string | null
          children_count?: number | null
          interests?: string[] | null
          goals?: string[] | null
          pain_points?: string[] | null
          last_contact_at?: string | null
          next_follow_up_at?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      nmm_tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: 'emerald' | 'amber' | 'blue' | 'red' | 'purple' | 'pink' | 'gray' | 'orange'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: 'emerald' | 'amber' | 'blue' | 'red' | 'purple' | 'pink' | 'gray' | 'orange'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: 'emerald' | 'amber' | 'blue' | 'red' | 'purple' | 'pink' | 'gray' | 'orange'
          created_at?: string
        }
      }
      nmm_contact_tags: {
        Row: {
          contact_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          contact_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          contact_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      nmm_interactions: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          type: 'note' | 'call' | 'whatsapp' | 'telegram' | 'email' | 'sms' | 'meeting' | 'presentation' | 'objection' | 'stage_change' | 'warmth_change' | 'system'
          direction: 'inbound' | 'outbound' | null
          subject: string | null
          content: string | null
          metadata: Json
          warmth_impact: number
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          type: 'note' | 'call' | 'whatsapp' | 'telegram' | 'email' | 'sms' | 'meeting' | 'presentation' | 'objection' | 'stage_change' | 'warmth_change' | 'system'
          direction?: 'inbound' | 'outbound' | null
          subject?: string | null
          content?: string | null
          metadata?: Json
          warmth_impact?: number
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          type?: 'note' | 'call' | 'whatsapp' | 'telegram' | 'email' | 'sms' | 'meeting' | 'presentation' | 'objection' | 'stage_change' | 'warmth_change' | 'system'
          direction?: 'inbound' | 'outbound' | null
          subject?: string | null
          content?: string | null
          metadata?: Json
          warmth_impact?: number
          occurred_at?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'distributor' | 'leader' | 'admin'
    }
  }
}

export type Profile = Database['public']['Tables']['nmm_profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['nmm_profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['nmm_profiles']['Update']

export type Contact = Database['public']['Tables']['nmm_contacts']['Row']
export type ContactInsert = Database['public']['Tables']['nmm_contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['nmm_contacts']['Update']

export type Tag = Database['public']['Tables']['nmm_tags']['Row']
export type TagInsert = Database['public']['Tables']['nmm_tags']['Insert']

export type Interaction = Database['public']['Tables']['nmm_interactions']['Row']
export type InteractionInsert = Database['public']['Tables']['nmm_interactions']['Insert']
