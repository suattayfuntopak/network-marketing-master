'use server'

import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendAdminNewUserEmail } from '@/lib/infra/mail'
import { SUPER_ADMIN_EMAIL } from '@/lib/domain/constants'

interface FormState {
  error?: string
  success?: string
  shouldRedirect?: boolean
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

  // Kayıt sonrası otomasyonu: hoş geldin e-postası (kullanıcıya), bilgilendirme
  // e-postası (admin'e) ve uygulama-içi bildirim (admin'e). after() ile yanıt
  // gönderildikten SONRA güvenle çalışır → Vercel'de fonksiyon, callback bitene
  // kadar canlı tutulur (eski "fire-and-forget .catch()" yarışında kullanıcının
  // hoş geldin maili lambda donunca kesiliyordu; admin maili şans eseri geçiyordu).
  if (data.user) {
    const newUserId = data.user.id
    after(async () => {
      // 1) Kullanıcıya hoş geldin e-postası (kritik — önce ve bağımsız)
      try {
        await sendWelcomeEmail(email, fullName, 'tr')
      } catch (err) {
        console.error('[signupAction] Welcome email failed:', err)
      }

      // 2) Admin'e bilgilendirme e-postası
      try {
        await sendAdminNewUserEmail(SUPER_ADMIN_EMAIL, email, fullName)
      } catch (err) {
        console.error('[signupAction] Admin notification email failed:', err)
      }

      // 3) Admin'e uygulama-içi bildirim (service role RLS'i baypas eder)
      try {
        const adminSupa = createAdminClient()
        const { data: usersPage } = await adminSupa.auth.admin.listUsers({ page: 1, perPage: 200 })
        const adminUser = usersPage?.users?.find((u) => u.email === SUPER_ADMIN_EMAIL)
        if (adminUser?.id && adminUser.id !== newUserId) {
          await adminSupa.from('nmm_notifications').insert({
            user_id: adminUser.id,
            title_tr: 'Yeni Platform Kaydı 🚀',
            title_en: 'New Platform Signup 🚀',
            description_tr: `${fullName} (${email}) platforma yeni bağımsız üye olarak kaydoldu!`,
            description_en: `${fullName} (${email}) signed up as a new independent member!`,
            type: 'user',
          })
        }
      } catch (err) {
        console.error('[signupAction] Admin in-app notification failed:', err)
      }
    })
  }

  // E-posta onayı zorunlu değilse identities boş gelir (zaten kayıtlı kullanıcı gibi davranır)
  if (data.user && data.user.identities?.length === 0) {
    return { error: 'Bu e-posta adresi zaten kayıtlı.' }
  }

  if (data.session) {
    return {
      success: 'Hesabınız başarıyla oluşturuldu! Giriş yapılıyor, yönlendiriliyorsunuz...',
      shouldRedirect: true
    }
  }

  return {
    success: 'Hesabın oluşturuldu! E-postanı kontrol edip doğrulama linkine tıkla.',
  }
}
