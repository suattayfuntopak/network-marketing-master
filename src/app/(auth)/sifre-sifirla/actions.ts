'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/infra/mail'
import { NMM_APP_URL } from '@/lib/infra/emailTemplate'
import { headers } from 'next/headers'

export type ResetErrorKey = 'resetErrorEmailRequired' | 'resetErrorGeneric'
export type ResetSuccessKey = 'resetSuccess'

interface FormState {
  errorKey?: ResetErrorKey
  successKey?: ResetSuccessKey
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''

  if (!email) return { errorKey: 'resetErrorEmailRequired' }

  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const isLocal =
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:')
  const origin = isLocal ? `http://${host}` : NMM_APP_URL
  const redirectTo = `${origin}/auth/callback?next=/sifre-guncelle`

  const admin = createAdminClient()
  const { data, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (linkError || !data?.properties?.action_link) {
    console.error('[resetPasswordAction] generateLink:', linkError?.message)
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      console.error('[resetPasswordAction] fallback resetPasswordForEmail:', error.message)
    }
    return { successKey: 'resetSuccess' }
  }

  const sent = await sendPasswordResetEmail(email, data.properties.action_link, 'tr')

  if (!sent) {
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) {
      console.error('[resetPasswordAction] fallback resetPasswordForEmail:', error.message)
      return { errorKey: 'resetErrorGeneric' }
    }
  }

  return { successKey: 'resetSuccess' }
}
