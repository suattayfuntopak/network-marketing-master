'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPasswordResetEmail } from '@/lib/infra/mail'
import { NMM_APP_URL } from '@/lib/infra/emailTemplate'
import { headers } from 'next/headers'

interface FormState {
  error?: string
  success?: string
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''

  if (!email) return { error: 'E-posta adresi zorunlu.' }

  // GÜVENLİK: kurtarma (recovery) bağlantısının origin'i isteğin Host/Origin
  // başlığından TÜRETİLMEZ — saldırgan Host header'ı zehirleyip sıfırlama linkini
  // kendi alanına yönlendirebilir (token hırsızlığı). Prod origin'i güvenilir sabite
  // (NMM_APP_URL) pinliyoruz; yalnızca yerel geliştirmede (localhost) host'tan türetilir.
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  // Tam-host eşleşmesi: `localhost.evil.com` gibi alt-alan adı hilesi `startsWith`'i
  // geçemesin (aksi halde Host-header zehirlemesi geri gelir).
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
