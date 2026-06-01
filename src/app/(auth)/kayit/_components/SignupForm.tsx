'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { signupAction } from '../actions'
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

export function SignupForm() {
  const { t } = useTranslation()
  const [state, action, pending] = useActionState<FormState, FormData>(
    signupAction,
    {}
  )

  useEffect(() => {
    if (state.success && state.shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = '/pano'
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [state.success, state.shouldRedirect])

  if (state.success) {
    return (
      <div className={authSuccessClass}>
        {state.success}
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className={authLabelClass} htmlFor="fullName">
          {t('auth.nameLabel')}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          placeholder="John Doe"
          className={authInputClass}
        />
      </div>

      <div>
        <label className={authLabelClass} htmlFor="email">
          {t('auth.emailLabel')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="email@example.com"
          className={authInputClass}
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
        />
      </div>

      {state.error && (
        <p className={authErrorClass}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={authPrimaryBtnClass}
      >
        {pending ? t('common.loading') : t('auth.registerBtn')}
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

