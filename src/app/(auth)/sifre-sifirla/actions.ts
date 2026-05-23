'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

interface FormState {
  error?: string
  success?: string
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''

  if (!email) return { error: 'E-posta adresi zorunlu.' }

  const headersList = await headers()
  const origin = headersList.get('origin') ?? ''
  const redirectTo = `${origin}/auth/callback?next=/sifre-guncelle`

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    console.error('[resetPasswordAction]', error.message)
    return { error: 'Bir hata oluştu. Lütfen tekrar dene.' }
  }

  // Supabase güvenlik gereği hem var olan hem olmayan email için başarı döner
  return { success: 'E-postanı kontrol et! Sıfırlama bağlantısı gönderildi.' }
}
