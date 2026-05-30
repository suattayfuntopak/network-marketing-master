// Auto-generated types for NMM Supabase schema.
// Run: supabase gen types typescript --local > src/types/database.types.ts
// to regenerate after schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type CandidateStage =
  | 'yeni'
  | 'iletisim'
  | 'davetli'
  | 'sunum'
  | 'takip'
  | 'kararsiz'
  | 'katildi'
  | 'ilgilenmedi'
  | 'pasif'
  | 'kayboldu'

export type WorkspaceMemberRole = 'leader' | 'member'

export type ActionType = 'call' | 'whatsapp' | 'note' | 'stage_change' | 'ai_generate'

export type NotificationType = 'bell' | 'alert' | 'info' | 'user' | 'calendar'

export interface Database {
  public: {
    Tables: {
      nmm_workspaces: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          invite_code: string
          created_at: string
          license_type: 'free' | 'leader' | 'master' | 'pro'
          license_expires_at: string | null
          parent_id: string | null
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          invite_code?: string
          created_at?: string
          license_type?: 'free' | 'leader' | 'master' | 'pro'
          license_expires_at?: string | null
          parent_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string | null
          invite_code?: string
          created_at?: string
          license_type?: 'free' | 'leader' | 'master' | 'pro'
          license_expires_at?: string | null
          parent_id?: string | null
        }
        Relationships: []
      }
      nmm_workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: WorkspaceMemberRole
          full_name: string | null
          created_at: string
          joined_at: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: WorkspaceMemberRole
          full_name?: string | null
          created_at?: string
          joined_at?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: WorkspaceMemberRole
          full_name?: string | null
          created_at?: string
          joined_at?: string | null
          avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'nmm_workspace_members_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'nmm_workspaces'
            referencedColumns: ['id']
          }
        ]
      }
      nmm_candidates: {
        Row: {
          id: string
          workspace_id: string
          owner_id: string
          full_name: string
          phone: string | null
          stage: CandidateStage
          last_contact_at: string | null
          note: string | null
          note_tr: string | null
          note_en: string | null
          avatar_url: string | null
          warmth: string
          next_follow_up_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          owner_id: string
          full_name: string
          phone?: string | null
          stage?: CandidateStage
          last_contact_at?: string | null
          note?: string | null
          note_tr?: string | null
          note_en?: string | null
          avatar_url?: string | null
          warmth?: string
          next_follow_up_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          owner_id?: string
          full_name?: string
          phone?: string | null
          stage?: CandidateStage
          last_contact_at?: string | null
          note?: string | null
          note_tr?: string | null
          note_en?: string | null
          avatar_url?: string | null
          warmth?: string
          next_follow_up_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nmm_candidates_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'nmm_workspaces'
            referencedColumns: ['id']
          }
        ]
      }
      nmm_daily_actions: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          candidate_id: string | null
          action_type: ActionType
          note: string | null
          note_tr: string | null
          note_en: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          candidate_id?: string | null
          action_type: ActionType
          note?: string | null
          note_tr?: string | null
          note_en?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          candidate_id?: string | null
          action_type?: ActionType
          note?: string | null
          note_tr?: string | null
          note_en?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nmm_daily_actions_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'nmm_workspaces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'nmm_daily_actions_candidate_id_fkey'
            columns: ['candidate_id']
            isOneToOne: false
            referencedRelation: 'nmm_candidates'
            referencedColumns: ['id']
          }
        ]
      }
      nmm_notifications: {
        Row: {
          id: string
          user_id: string
          title_tr: string
          title_en: string
          description_tr: string
          description_en: string
          type: NotificationType
          read: boolean
          created_at: string
          candidate_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title_tr: string
          title_en: string
          description_tr: string
          description_en: string
          type?: NotificationType
          read?: boolean
          created_at?: string
          candidate_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title_tr?: string
          title_en?: string
          description_tr?: string
          description_en?: string
          type?: NotificationType
          read?: boolean
          created_at?: string
          candidate_id?: string | null
        }
        Relationships: []
      }
      nmm_onboarding_progress: {
        Row: {
          id: string
          user_id: string
          step_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          step_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          step_id?: string
          created_at?: string
        }
        Relationships: []
      }
      nmm_presentation_materials: {
        Row: {
          id: string
          workspace_id: string
          title: string
          url: string
          whatsapp_template: string
          sort_order: number
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          url: string
          whatsapp_template: string
          sort_order?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          url?: string
          whatsapp_template?: string
          sort_order?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      nmm_custom_trainings: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          item_key: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          item_key: string
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          item_key?: string
          data?: Json
          created_at?: string
        }
        Relationships: []
      }
      nmm_custom_objections: {
        Row: {
          id: string
          user_id: string
          workspace_id: string | null
          item_key: string
          data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          workspace_id?: string | null
          item_key: string
          data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          workspace_id?: string | null
          item_key?: string
          data?: Json
          created_at?: string
        }
        Relationships: []
      }
      nmm_ai_usage_daily: {
        Row: {
          user_id: string
          workspace_id: string | null
          usage_date: string
          message_count: number
          roleplay_count: number
          compliance_count: number
          updated_at: string
        }
        Insert: {
          user_id: string
          workspace_id?: string | null
          usage_date: string
          message_count?: number
          roleplay_count?: number
          compliance_count?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          workspace_id?: string | null
          usage_date?: string
          message_count?: number
          roleplay_count?: number
          compliance_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'nmm_ai_usage_daily_workspace_id_fkey'
            columns: ['workspace_id']
            isOneToOne: false
            referencedRelation: 'nmm_workspaces'
            referencedColumns: ['id']
          }
        ]
      }
      nmm_user_progress: {
        Row: {
          user_id: string
          workspace_id: string | null
          read_trainings: Json
          fav_trainings: Json
          read_objections: Json
          fav_objections: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          workspace_id?: string | null
          read_trainings?: Json
          fav_trainings?: Json
          read_objections?: Json
          fav_objections?: Json
          updated_at?: string
        }
        Update: {
          user_id?: string
          workspace_id?: string | null
          read_trainings?: Json
          fav_trainings?: Json
          read_objections?: Json
          fav_objections?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      nmm_join_workspace: {
        Args: { p_invite_code: string }
        Returns: Json
      }
      nmm_remove_member: {
        Args: { p_member_id: string; p_member_name: string }
        Returns: Json
      }
      nmm_sync_member_avatar: {
        Args: { p_avatar_url: string }
        Returns: undefined
      }
      nmm_resolve_team_avatars: {
        Args: { p_workspace_id: string; p_user_ids: string[] }
        Returns: Json
      }
      nmm_fetch_team_with_downlines: {
        Args: { p_workspace_id: string }
        Returns: Json
      }
      nmm_count_candidates_per_workspace: {
        Args: Record<string, never>
        Returns: Json
      }
      nmm_increment_ai_usage_daily: {
        Args: {
          p_user_id: string
          p_workspace_id: string
          p_usage_date: string
          p_kind: string
        }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
  }
}

// Convenience row types
export type NmmWorkspace = Database['public']['Tables']['nmm_workspaces']['Row']
export type NmmWorkspaceMember = Database['public']['Tables']['nmm_workspace_members']['Row']
export type NmmCandidate = Database['public']['Tables']['nmm_candidates']['Row']
export type NmmDailyAction = Database['public']['Tables']['nmm_daily_actions']['Row']
export type NmmAiUsageDaily = Database['public']['Tables']['nmm_ai_usage_daily']['Row']
export type NmmNotification = Database['public']['Tables']['nmm_notifications']['Row']
export type NmmOnboardingProgress = Database['public']['Tables']['nmm_onboarding_progress']['Row']

export type NmmCandidateInsert = Database['public']['Tables']['nmm_candidates']['Insert']
export type NmmCandidateUpdate = Database['public']['Tables']['nmm_candidates']['Update']
export type NmmDailyActionInsert = Database['public']['Tables']['nmm_daily_actions']['Insert']
export type NmmNotificationInsert = Database['public']['Tables']['nmm_notifications']['Insert']
export type NmmOnboardingProgressInsert = Database['public']['Tables']['nmm_onboarding_progress']['Insert']
