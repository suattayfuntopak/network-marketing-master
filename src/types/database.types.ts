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
  | 'kayboldu'

export type WorkspaceMemberRole = 'leader' | 'member'

export type ActionType = 'call' | 'whatsapp' | 'note' | 'stage_change'

export interface Database {
  public: {
    Tables: {
      nmm_workspaces: {
        Row: {
          id: string
          name: string
          owner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string | null
          created_at?: string
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
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: WorkspaceMemberRole
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          role?: WorkspaceMemberRole
          full_name?: string | null
          created_at?: string
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
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          candidate_id?: string | null
          action_type: ActionType
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          user_id?: string
          candidate_id?: string | null
          action_type?: ActionType
          note?: string | null
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
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}

// Convenience row types
export type NmmWorkspace = Database['public']['Tables']['nmm_workspaces']['Row']
export type NmmWorkspaceMember = Database['public']['Tables']['nmm_workspace_members']['Row']
export type NmmCandidate = Database['public']['Tables']['nmm_candidates']['Row']
export type NmmDailyAction = Database['public']['Tables']['nmm_daily_actions']['Row']

export type NmmCandidateInsert = Database['public']['Tables']['nmm_candidates']['Insert']
export type NmmCandidateUpdate = Database['public']['Tables']['nmm_candidates']['Update']
export type NmmDailyActionInsert = Database['public']['Tables']['nmm_daily_actions']['Insert']
