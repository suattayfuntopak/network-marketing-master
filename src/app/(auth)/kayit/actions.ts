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

export type SignupErrorKey =
  | 'signupErrorRequired'
  | 'signupErrorNameRequired'
  | 'signupErrorAlreadyRegistered'
  | 'signupErrorPasswordShort'
  | 'signupErrorInvalidEmail'
  | 'signupErrorRateLimit'
  | 'signupErrorDisabled'
  | 'signupErrorGeneric'

export type SignupSuccessKey = 'signupSuccessRedirect' | 'signupSuccessConfirm'

interface FormState {
  errorKey?: SignupErrorKey
  successKey?: SignupSuccessKey
  shouldRedirect?: boolean
}

const SUPABASE_ERROR_MAP: Record<string, SignupErrorKey> = {
  'User already registered': 'signupErrorAlreadyRegistered',
  'Password should be at least 6 characters': 'signupErrorPasswordShort',
  'Unable to validate email address: invalid format': 'signupErrorInvalidEmail',
  'Email rate limit exceeded': 'signupErrorRateLimit',
  signup_disabled: 'signupErrorDisabled',
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const fullName = (formData.get('fullName') as string | null)?.trim() ?? ''
  const inviteCode = (formData.get('ref') as string | null)?.trim().toUpperCase() ?? ''
  const inviteCandidateId = (formData.get('aday') as string | null)?.trim() ?? ''

  if (!email || !password) {
    return { errorKey: 'signupErrorRequired' }
  }

  const resolvedName =
    inviteCode && inviteCandidateId
      ? await resolveInviteSignupName(inviteCode, inviteCandidateId, fullName)
      : fullName.trim()

  if (!resolvedName) {
    return { errorKey: 'signupErrorNameRequired' }
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
    return { errorKey: SUPABASE_ERROR_MAP[error.message] ?? 'signupErrorGeneric' }
  }

  if (data.user) {
    const newUserId = data.user.id
    after(async () => {
      if (inviteCode) {
        await insertProductEvent({
          eventName: PRODUCT_EVENTS.inviteAccepted,
          metadata: { code: inviteCode, withCandidate: !!inviteCandidateId },
        })
      }

      try {
        await sendWelcomeEmail(email, resolvedName, 'tr')
      } catch (err) {
        console.error('[signupAction] Welcome email failed:', err)
      }

      try {
        await sendAdminNewUserEmail(SUPER_ADMIN_EMAIL, email, resolvedName)
      } catch (err) {
        console.error('[signupAction] Admin notification email failed:', err)
      }

      try {
        const adminSupa = createAdminClient()
        const { data: usersPage } = await adminSupa.auth.admin.listUsers({ page: 1, perPage: 200 })
        const adminUser = usersPage?.users?.find(u => u.email === SUPER_ADMIN_EMAIL)
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

  if (data.user && data.user.identities?.length === 0) {
    return { errorKey: 'signupErrorAlreadyRegistered' }
  }

  if (data.session) {
    try {
      await ensureWorkspaceAction()
    } catch (wsErr) {
      console.error('[signupAction] ensureWorkspace after signup:', wsErr)
    }
    return {
      successKey: 'signupSuccessRedirect',
      shouldRedirect: true,
    }
  }

  return { successKey: 'signupSuccessConfirm' }
}
