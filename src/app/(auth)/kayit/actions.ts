'use server'

import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendAdminNewUserEmail } from '@/lib/infra/mail'
import { SUPER_ADMIN_EMAIL } from '@/lib/domain/constants'
import { resolveInviteSignupName } from '@/lib/domain/inviteSignup'
import { ensureWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { insertProductEvent } from '@/lib/infra/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'

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
  // Sponsor davet token'ı (?ref=KOD&aday=ID) — varsa user_metadata'ya yazılır;
  // ilk workspace oluşturulurken otomatik ekip bağlaması için kullanılır.
  const inviteCode = (formData.get('ref') as string | null)?.trim().toUpperCase() ?? ''
  const inviteCandidateId = (formData.get('aday') as string | null)?.trim() ?? ''

  if (!email || !password) {
    return { error: 'E-posta ve şifre zorunlu.' }
  }

  const resolvedName =
    inviteCode && inviteCandidateId
      ? await resolveInviteSignupName(inviteCode, inviteCandidateId, fullName)
      : fullName.trim()

  if (!resolvedName) {
    return { error: 'Ad soyad zorunlu.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: resolvedName,
        ...(inviteCode ? { pending_invite_code: inviteCode } : {}),
        ...(inviteCandidateId ? { pending_candidate_id: inviteCandidateId } : {}),
      },
    },
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
      // 0) Dalga 0 — davet→kayıt dönüşümü / ekip-içi yayılma KPI'sı.
      if (inviteCode) {
        await insertProductEvent({
          eventName: PRODUCT_EVENTS.inviteAccepted,
          metadata: { code: inviteCode, withCandidate: !!inviteCandidateId },
        })
      }

      // 1) Kullanıcıya hoş geldin e-postası (kritik — önce ve bağımsız)
      try {
        await sendWelcomeEmail(email, resolvedName, 'tr')
      } catch (err) {
        console.error('[signupAction] Welcome email failed:', err)
      }

      // 2) Admin'e bilgilendirme e-postası
      try {
        await sendAdminNewUserEmail(SUPER_ADMIN_EMAIL, email, resolvedName)
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
            description_tr: `${resolvedName} (${email}) platforma yeni bağımsız üye olarak kaydoldu!`,
            description_en: `${resolvedName} (${email}) signed up as a new independent member!`,
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
    try {
      await ensureWorkspaceAction()
    } catch (wsErr) {
      console.error('[signupAction] ensureWorkspace after signup:', wsErr)
    }
    return {
      success: 'Hesabınız başarıyla oluşturuldu! Panoya yönlendiriliyorsunuz...',
      shouldRedirect: true,
    }
  }

  return {
    success: 'Hesabın oluşturuldu! E-postanı kontrol edip doğrulama linkine tıkla.',
  }
}
