'use client'

import { useActionState, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { signupAction } from '../actions'
import { getInviteSignupPrefillAction, type InviteSignupPrefill } from '@/lib/domain/inviteSignup'
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkSecondaryClass,
  authMutedClass,
  authPrimaryBtnClass,
  authSuccessClass,
} from '@/app/(auth)/_components/authUi'

interface FormState {
  error?: string
  success?: string
  shouldRedirect?: boolean
}

const readonlyInputClass = `${authInputClass} cursor-not-allowed bg-[var(--bg-subtle)]/80 text-[var(--text-2)]`

export function SignupForm() {
  const { t } = useTranslation()
  const [state, action, pending] = useActionState<FormState, FormData>(
    signupAction,
    {},
  )

  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')?.trim() ?? ''
  const aday = searchParams.get('aday')?.trim() ?? ''
  const hasInviteParams = Boolean(ref && aday)

  const [invite, setInvite] = useState<InviteSignupPrefill | null>(null)
  const [inviteLoading, setInviteLoading] = useState(hasInviteParams)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref || !aday) return

    let cancelled = false
    getInviteSignupPrefillAction(ref, aday)
      .then(prefill => {
        if (cancelled) return
        if (!prefill) {
          setInviteError(t('auth.invitePrefillInvalid'))
          return
        }
        if (!prefill.email) {
          setInviteError(t('auth.invitePrefillNoEmail'))
          return
        }
        setInvite(prefill)
      })
      .catch(() => {
        if (!cancelled) setInviteError(t('auth.invitePrefillInvalid'))
      })
      .finally(() => {
        if (!cancelled) setInviteLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [ref, aday, t])

  useEffect(() => {
    if (state.success && state.shouldRedirect) {
      window.location.href = '/pano'
    }
  }, [state.success, state.shouldRedirect])

  if (state.success) {
    return <div className={authSuccessClass}>{state.success}</div>
  }

  const inviteReady = !!invite
  const submitBlocked = inviteLoading || (hasInviteParams && !!inviteError)

  return (
    <form action={action} className="space-y-5">
      {inviteReady && (
        <>
          <input type="hidden" name="ref" value={invite.ref} />
          <input type="hidden" name="aday" value={invite.aday} />
          <input type="hidden" name="fullName" value={invite.fullName} />
          <input type="hidden" name="email" value={invite.email} />
        </>
      )}

      {inviteError && (
        <p className={authErrorClass} data-testid="signup-invite-error">
          {inviteError}
        </p>
      )}

      <div>
        <label className={authLabelClass} htmlFor="fullName">
          {t('auth.nameLabel')}
        </label>
        <input
          id="fullName"
          name={inviteReady ? undefined : 'fullName'}
          type="text"
          required={!inviteReady}
          readOnly={inviteReady}
          defaultValue={invite?.fullName}
          autoComplete="name"
          placeholder="John Doe"
          className={inviteReady ? readonlyInputClass : authInputClass}
        />
      </div>

      <div>
        <label className={authLabelClass} htmlFor="email">
          {t('auth.emailLabel')}
        </label>
        <input
          id="email"
          name={inviteReady ? undefined : 'email'}
          type="email"
          required={!inviteReady}
          readOnly={inviteReady}
          defaultValue={invite?.email}
          autoComplete="email"
          placeholder="email@example.com"
          className={inviteReady ? readonlyInputClass : authInputClass}
        />
      </div>

      <div>
        <label className={authLabelClass} htmlFor="password">
          {t('auth.passwordLabel')}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={6}
          className={authInputClass}
          disabled={submitBlocked}
        />
        {inviteReady && (
          <p className={`mt-1.5 text-xs ${authMutedClass}`} data-testid="signup-invite-hint">
            {t('auth.invitePasswordOnlyHint')}
          </p>
        )}
      </div>

      {state.error && <p className={authErrorClass}>{state.error}</p>}

      <button
        type="submit"
        disabled={pending || submitBlocked}
        className={authPrimaryBtnClass}
      >
        {pending || inviteLoading ? t('common.loading') : t('auth.registerBtn')}
      </button>

      <div className={`pt-2 text-center text-xs ${authMutedClass}`}>
        {t('auth.hasAccount')}{' '}
        <Link href="/giris" className={`${authLinkSecondaryClass} ml-1`}>
          {t('auth.loginTitle')}
        </Link>
      </div>
    </form>
  )
}
