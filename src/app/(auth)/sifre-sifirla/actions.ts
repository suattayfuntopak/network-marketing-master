'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/infra/mail'
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
  const redirectTo = `${origin}/sifre-guncelle`

  const admin = createAdminClient()
  const { data, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (linkError || !data?.properties?.action_link) {
    console.error('[resetPasswordAction] generateLink:', linkError?.message)
    return { error: 'Bir hata oluştu. Lütfen tekrar dene.' }
  }

  const sent = await sendPasswordResetEmail(email, data.properties.action_link, 'tr')

  if (!sent) {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      console.error('[resetPasswordAction] fallback resetPasswordForEmail:', error.message)
      return { error: 'Bir hata oluştu. Lütfen tekrar dene.' }
    }
  }

  // Supabase güvenlik gereği hem var olan hem olmayan email için başarı döner
  return { success: 'E-postanı kontrol et! Sıfırlama bağlantısı gönderildi.' }
}
