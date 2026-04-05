import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/constants'

export function useAuth() {
  const navigate = useNavigate()
  const { user, session, profile, isLoading, reset } = useAuthStore()

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    reset()
    navigate(ROUTES.LOGIN)
  }, [navigate, reset])

  const isAuthenticated = !!session && !!user

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated,
    signOut,
  }
}
