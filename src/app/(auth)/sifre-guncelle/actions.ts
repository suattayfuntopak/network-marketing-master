'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface FormState {
  error?: string
  success?: string
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = (formData.get('password') as string | null) ?? ''

  if (password.length < 6) return { error: 'Şifre en az 6 karakter olmalı.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('[updatePasswordAction]', error.message)
    // Link süresi dolmuş olabilir
    if (error.message.includes('expired') || error.message.includes('invalid')) {
      return { error: 'Bağlantı süresi dolmuş. Yeni sıfırlama isteği gönder.' }
    }
    return { error: 'Şifre güncellenemedi. Lütfen tekrar dene.' }
  }

  redirect('/bugun')
}
