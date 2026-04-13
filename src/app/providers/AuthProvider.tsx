import { useCallback, useEffect, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { ensureDemoWorkspace } from '@/lib/public/demoWorkspace'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setUser, setSession, setProfile, setLoading, reset } = useAuthStore()

  const fetchProfile = useCallback(async (user: User) => {
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

    setProfile(nextProfile ? { ...nextProfile, role: 'admin' } : nextProfile)
    setLoading(false)
  }, [setLoading, setProfile])

  useEffect(() => {
    let isMounted = true

    const bootstrapAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!isMounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user)
        return
      }

      setLoading(false)
    }

    void bootstrapAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          reset()
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, reset, setLoading, setSession, setUser])

  return <>{children}</>
}
