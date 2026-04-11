import { useEffect, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { ensureDemoWorkspace } from '@/lib/public/demoWorkspace'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setSession, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          reset()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProfile(user: User) {
    const { data: initialProfile } = await supabase
      .from('nmm_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    let nextProfile = initialProfile

    if (user.user_metadata?.workspace_role === 'leader' && initialProfile?.role === 'distributor') {
      const { data: updatedProfile } = await supabase
        .from('nmm_profiles')
        .update({ role: 'leader' })
        .eq('id', user.id)
        .select('*')
        .single()

      nextProfile = updatedProfile ?? initialProfile
    }

    if (user.user_metadata?.workspace_mode === 'demo') {
      try {
        await ensureDemoWorkspace(user.id)
      } catch (error) {
        console.error('[AuthProvider] demo workspace seed error:', error)
      }
    }

    setProfile(nextProfile)
    setLoading(false)
  }

  return <>{children}</>
}
