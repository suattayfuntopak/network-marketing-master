'use server'

import { createClient } from '@/lib/supabase/server'

interface FormState {
  error?: string
  success?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  'User already registered': 'Bu e-posta adresi zaten kayıtlı.',
  'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalı.',
  'Unable to validate email address: invalid format': 'Geçerli bir e-posta adresi gir.',
  'Email rate limit exceeded': 'Çok fazla deneme yapıldı. Biraz bekle.',
  'signup_disabled': 'Kayıt şu an devre dışı.',
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const fullName = (formData.get('fullName') as string | null)?.trim() ?? ''

  if (!email || !password || !fullName) {
    return { error: 'Tüm alanları doldurmak zorunlu.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    console.error('[signupAction] Supabase error:', error.message, error.status)
    const friendly = ERROR_MESSAGES[error.message] ?? `Hata: ${error.message}`
    return { error: friendly }
  }

  // E-posta onayı zorunlu değilse identities boş gelir (zaten kayıtlı kullanıcı gibi davranır)
  if (data.user && data.user.identities?.length === 0) {
    return { error: 'Bu e-posta adresi zaten kayıtlı.' }
  }

  return {
    success: 'Hesabın oluşturuldu! E-postanı kontrol edip doğrulama linkine tıkla.',
  }
}
