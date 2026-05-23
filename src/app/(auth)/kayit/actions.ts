'use server'

import { createClient } from '@/lib/supabase/server'

interface FormState {
  error?: string
  success?: string
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    return { error: 'Kayıt sırasında hata oluştu. Lütfen tekrar dene.' }
  }

  return {
    success: 'Hesabın oluşturuldu! E-postanı kontrol edip doğrulama linkine tıkla.',
  }
}
