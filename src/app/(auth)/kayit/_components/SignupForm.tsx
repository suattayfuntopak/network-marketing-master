'use client'

import { useActionState, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { signupAction, type SignupErrorKey, type SignupSuccessKey } from '../actions'
import {
  getInviteSignupPrefillAction,
  getInviteSponsorAction,
  type InviteSignupPrefill,
  type InviteSponsor,
} from '@/lib/domain/inviteSignup'
import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import { PRODUCT_EVENTS } from '@/lib/domain/productEvents'
import { getAnalyticsSessionId } from '@/lib/utils/analyticsSession'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
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
  errorKey?: SignupErrorKey
  successKey?: SignupSuccessKey
  shouldRedirect?: boolean
}

// i18n:unused tarayıcısı literal anahtarları görsün diye.
const SIGNUP_ERROR_I18N: Record<SignupErrorKey, string> = {
  signupErrorRequired: 'auth.signupErrorRequired',
  signupErrorNameRequired: 'auth.signupErrorNameRequired',
  signupErrorAlreadyRegistered: 'auth.signupErrorAlreadyRegistered',
  signupErrorPasswordShort: 'auth.signupErrorPasswordShort',
  signupErrorInvalidEmail: 'auth.signupErrorInvalidEmail',
  signupErrorRateLimit: 'auth.signupErrorRateLimit',
  signupErrorDisabled: 'auth.signupErrorDisabled',
  signupErrorGeneric: 'auth.signupErrorGeneric',
}

const SIGNUP_SUCCESS_I18N: Record<SignupSuccessKey, string> = {
  signupSuccessRedirect: 'auth.signupSuccessRedirect',
  signupSuccessConfirm: 'auth.signupSuccessConfirm',
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
  const [sponsor, setSponsor] = useState<InviteSponsor | null>(null)

  // Kişisel davet karşılaması — sponsor adı/yüzü/ekibi (yalnız ref yeter).
  useEffect(() => {
    if (!ref) return
    let cancelled = false
    void logProductEventAction(
      PRODUCT_EVENTS.inviteLandingView,
      { code: ref },
      getAnalyticsSessionId(),
    )
    getInviteSponsorAction(ref)
      .then(s => {
        if (!cancelled && s) setSponsor(s)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [ref])

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
    if (state.successKey && state.shouldRedirect) {
      window.location.href = '/pano'
    }
  }, [state.successKey, state.shouldRedirect])

  if (state.successKey) {
    return <div className={authSuccessClass}>{t(SIGNUP_SUCCESS_I18N[state.successKey])}</div>
  }

  const inviteReady = !!invite
  const emailReadOnly = Boolean(invite?.email)
  const nameReadOnly = Boolean(invite?.fullName)
  const submitBlocked = inviteLoading || (hasInviteParams && !!inviteError)

  return (
    <>
      {sponsor && (
        <div
          className="mb-5 flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand-subtle/30 p-3.5"
          data-testid="signup-sponsor-welcome"
        >
          <PersonAvatar
            name={sponsor.sponsorName || sponsor.teamName || '?'}
            imageUrl={sponsor.avatarUrl}
            size="lg"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-1)]">
              {sponsor.sponsorName
                ? t('auth.inviteSponsorWelcome', {
                    sponsor: sponsor.sponsorName,
                    team: sponsor.teamName,
                  })
                : t('auth.inviteTeamWelcome', { team: sponsor.teamName })}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-3)]">
              {t('auth.inviteSponsorSubtitle')}
            </p>
          </div>
        </div>
      )}

      <form action={action} className="space-y-5">
        {inviteReady && (
          <>
            <input type="hidden" name="ref" value={invite.ref} />
          <input type="hidden" name="aday" value={invite.aday} />
          {nameReadOnly && <input type="hidden" name="fullName" value={invite.fullName} />}
          {emailReadOnly && <input type="hidden" name="email" value={invite.email} />}
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
          name={nameReadOnly ? undefined : 'fullName'}
          type="text"
          required
          readOnly={nameReadOnly}
          defaultValue={invite?.fullName ?? ''}
          autoComplete="name"
          placeholder="John Doe"
          className={nameReadOnly ? readonlyInputClass : authInputClass}
        />
      </div>

      <div>
        <label className={authLabelClass} htmlFor="email">
          {t('auth.emailLabel')}
        </label>
        <input
          id="email"
          name={emailReadOnly ? undefined : 'email'}
          type="email"
          required
          readOnly={emailReadOnly}
          defaultValue={invite?.email ?? ''}
          autoComplete="email"
          placeholder="email@example.com"
          className={emailReadOnly ? readonlyInputClass : authInputClass}
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

      {state.errorKey && (
        <p className={authErrorClass}>{t(SIGNUP_ERROR_I18N[state.errorKey])}</p>
      )}

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
    </>
  )
}
