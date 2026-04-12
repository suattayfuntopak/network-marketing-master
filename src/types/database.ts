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
        Relationships: []
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

      nmm_workspaces: {
        Row: {
          id: string
          owner_user_id: string
          name: string
          slug: string
          default_locale: string
          country_code: string
          is_personal: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_user_id: string
          name: string
          slug: string
          default_locale?: string
          country_code?: string
          is_personal?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          owner_user_id?: string
          name?: string
          slug?: string
          default_locale?: string
          country_code?: string
          is_personal?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      nmm_workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: 'owner' | 'leader' | 'member' | 'assistant'
          status: 'invited' | 'active' | 'paused' | 'removed'
          invited_by: string | null
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: 'owner' | 'leader' | 'member' | 'assistant'
          status?: 'invited' | 'active' | 'paused' | 'removed'
          invited_by?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: 'owner' | 'leader' | 'member' | 'assistant'
          status?: 'invited' | 'active' | 'paused' | 'removed'
          invited_by?: string | null
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
      }

      nmm_member_relationships: {
        Row: {
          id: string
          workspace_id: string
          sponsor_user_id: string
          member_user_id: string
          depth: number
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          sponsor_user_id: string
          member_user_id: string
          depth?: number
          created_at?: string
        }
        Relationships: []
        Update: {
          id?: string
          workspace_id?: string
          sponsor_user_id?: string
          member_user_id?: string
          depth?: number
          created_at?: string
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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

      // ─── Faz 2: Pipeline ────────────────────────────────────
      nmm_pipeline_stages: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          description: string | null
          color: string
          icon: string | null
          position: number
          win_probability: number
          is_system: boolean
          is_won_stage: boolean
          is_lost_stage: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          description?: string | null
          color?: string
          icon?: string | null
          position: number
          win_probability?: number
          is_system?: boolean
          is_won_stage?: boolean
          is_lost_stage?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          name?: string
          slug?: string
          description?: string | null
          color?: string
          icon?: string | null
          position?: number
          win_probability?: number
          is_won_stage?: boolean
          is_lost_stage?: boolean
          updated_at?: string
        }
      }

      nmm_deals: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          stage_id: string
          title: string
          deal_type: 'prospect' | 'product_sale' | 'recruitment'
          value: number
          currency: string
          probability: number
          expected_close_date: string | null
          actual_close_date: string | null
          status: 'open' | 'won' | 'lost'
          lost_reason: string | null
          notes: string | null
          position_in_stage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          stage_id: string
          title: string
          deal_type?: 'prospect' | 'product_sale' | 'recruitment'
          value?: number
          currency?: string
          probability?: number
          expected_close_date?: string | null
          actual_close_date?: string | null
          status?: 'open' | 'won' | 'lost'
          lost_reason?: string | null
          notes?: string | null
          position_in_stage?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          contact_id?: string
          stage_id?: string
          title?: string
          deal_type?: 'prospect' | 'product_sale' | 'recruitment'
          value?: number
          currency?: string
          probability?: number
          expected_close_date?: string | null
          actual_close_date?: string | null
          status?: 'open' | 'won' | 'lost'
          lost_reason?: string | null
          notes?: string | null
          position_in_stage?: number
          updated_at?: string
        }
      }

      nmm_stage_history: {
        Row: {
          id: string
          deal_id: string
          user_id: string
          from_stage_id: string | null
          to_stage_id: string
          duration_in_stage: string | null
          moved_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          user_id: string
          from_stage_id?: string | null
          to_stage_id: string
          duration_in_stage?: string | null
          moved_at?: string
        }
        Relationships: []
        Update: {
          deal_id?: string
          user_id?: string
          from_stage_id?: string | null
          to_stage_id?: string
          duration_in_stage?: string | null
          moved_at?: string
        }
      }

      // ─── Faz 3: Calendar ────────────────────────────────────
      nmm_appointments: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          deal_id: string | null
          title: string
          description: string | null
          type: 'meeting' | 'call' | 'video_call' | 'presentation' | 'coffee' | 'event' | 'other'
          location: string | null
          meeting_url: string | null
          starts_at: string
          ends_at: string
          all_day: boolean
          timezone: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          outcome: string | null
          outcome_notes: string | null
          reminder_minutes: number[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id?: string | null
          deal_id?: string | null
          title: string
          description?: string | null
          type?: 'meeting' | 'call' | 'video_call' | 'presentation' | 'coffee' | 'event' | 'other'
          location?: string | null
          meeting_url?: string | null
          starts_at: string
          ends_at: string
          all_day?: boolean
          timezone?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          outcome?: string | null
          outcome_notes?: string | null
          reminder_minutes?: number[]
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          contact_id?: string | null
          deal_id?: string | null
          title?: string
          description?: string | null
          type?: 'meeting' | 'call' | 'video_call' | 'presentation' | 'coffee' | 'event' | 'other'
          location?: string | null
          meeting_url?: string | null
          starts_at?: string
          ends_at?: string
          all_day?: boolean
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          outcome?: string | null
          outcome_notes?: string | null
          reminder_minutes?: number[]
          updated_at?: string
        }
      }

      nmm_follow_ups: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          deal_id: string | null
          title: string
          notes: string | null
          action_type: 'call' | 'message' | 'email' | 'visit' | 'send_info' | 'check_in' | 'other'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          due_at: string
          status: 'pending' | 'completed' | 'snoozed' | 'cancelled'
          completed_at: string | null
          snoozed_until: string | null
          auto_generated: boolean
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          deal_id?: string | null
          title: string
          notes?: string | null
          action_type?: 'call' | 'message' | 'email' | 'visit' | 'send_info' | 'check_in' | 'other'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_at: string
          status?: 'pending' | 'completed' | 'snoozed' | 'cancelled'
          completed_at?: string | null
          snoozed_until?: string | null
          auto_generated?: boolean
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          title?: string
          notes?: string | null
          action_type?: 'call' | 'message' | 'email' | 'visit' | 'send_info' | 'check_in' | 'other'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          due_at?: string
          status?: 'pending' | 'completed' | 'snoozed' | 'cancelled'
          completed_at?: string | null
          snoozed_until?: string | null
          updated_at?: string
        }
      }

      // ─── Faz 4: Messages ────────────────────────────────────
      nmm_message_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          channel: string
          tone: string
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
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          channel?: string
          tone?: string
          language?: string
          content: string
          variables?: string[] | null
          goal?: string | null
          use_case?: string | null
          is_ai_generated?: boolean
          is_favorite?: boolean
          is_shared?: boolean
          use_count?: number
          success_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          name?: string
          category?: string
          channel?: string
          tone?: string
          content?: string
          variables?: string[] | null
          goal?: string | null
          use_case?: string | null
          is_favorite?: boolean
          is_shared?: boolean
          use_count?: number
          success_count?: number
          updated_at?: string
        }
      }

      nmm_ai_messages: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          prompt: string
          context: Json
          category: string
          channel: string
          tone: string
          language: string
          generated_content: string
          variants: Json | null
          was_used: boolean
          was_edited: boolean
          final_content: string | null
          feedback: 'great' | 'good' | 'meh' | 'bad' | null
          tokens_used: number | null
          model: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id?: string | null
          prompt: string
          context?: Json
          category: string
          channel: string
          tone: string
          language?: string
          generated_content: string
          variants?: Json | null
          was_used?: boolean
          was_edited?: boolean
          final_content?: string | null
          feedback?: 'great' | 'good' | 'meh' | 'bad' | null
          tokens_used?: number | null
          model?: string
          created_at?: string
        }
        Relationships: []
        Update: {
          was_used?: boolean
          was_edited?: boolean
          final_content?: string | null
          feedback?: 'great' | 'good' | 'meh' | 'bad' | null
        }
      }

      // ─── Faz 4: Academy & Objections ────────────────────────
      nmm_objections: {
        Row: {
          id: string
          user_id: string | null
          category: string
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
        Insert: {
          id?: string
          user_id: string
          category: string
          objection_text: string
          short_label?: string | null
          response_text: string
          response_short?: string | null
          approach?: string | null
          example_dialog?: string | null
          video_url?: string | null
          reading_url?: string | null
          language?: string
          is_system?: boolean
          is_favorite?: boolean
          use_count?: number
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          category?: string
          objection_text?: string
          short_label?: string | null
          response_text?: string
          response_short?: string | null
          approach?: string | null
          example_dialog?: string | null
          video_url?: string | null
          reading_url?: string | null
          is_favorite?: boolean
          use_count?: number
          tags?: string[] | null
          updated_at?: string
        }
      }

      nmm_academy_content: {
        Row: {
          id: string
          user_id: string | null
          type: string
          category: string
          level: string
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
        Insert: {
          id?: string
          user_id: string
          type: string
          category: string
          level?: string
          title: string
          summary?: string | null
          content?: string | null
          video_url?: string | null
          reading_time_minutes?: number | null
          tags?: string[] | null
          language?: string
          is_system?: boolean
          is_published?: boolean
          is_favorite?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
        Update: {
          type?: string
          category?: string
          level?: string
          title?: string
          summary?: string | null
          content?: string | null
          video_url?: string | null
          reading_time_minutes?: number | null
          tags?: string[] | null
          is_favorite?: boolean
          is_published?: boolean
          view_count?: number
          updated_at?: string
        }
      }
    }

    Views: Record<string, never>
    Functions: {
      increment_template_use_count: {
        Args: { template_id: string }
        Returns: void
      }
    }
    Enums: {
      user_role: 'distributor' | 'leader' | 'admin'
    }
  }
}

export type Profile = Database['public']['Tables']['nmm_profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['nmm_profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['nmm_profiles']['Update']

export type Workspace = Database['public']['Tables']['nmm_workspaces']['Row']
export type WorkspaceInsert = Database['public']['Tables']['nmm_workspaces']['Insert']
export type WorkspaceMember = Database['public']['Tables']['nmm_workspace_members']['Row']
export type WorkspaceMemberInsert = Database['public']['Tables']['nmm_workspace_members']['Insert']
export type MemberRelationship = Database['public']['Tables']['nmm_member_relationships']['Row']

export type Contact = Database['public']['Tables']['nmm_contacts']['Row']
export type ContactInsert = Database['public']['Tables']['nmm_contacts']['Insert']
export type ContactUpdate = Database['public']['Tables']['nmm_contacts']['Update']

export type Tag = Database['public']['Tables']['nmm_tags']['Row']
export type TagInsert = Database['public']['Tables']['nmm_tags']['Insert']

export type Interaction = Database['public']['Tables']['nmm_interactions']['Row']
export type InteractionInsert = Database['public']['Tables']['nmm_interactions']['Insert']
