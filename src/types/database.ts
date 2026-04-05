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
