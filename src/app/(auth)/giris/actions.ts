'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface FormState {
  error?: string
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'E-posta veya şifre hatalı.' }
  }

  redirect('/bugun')
}
