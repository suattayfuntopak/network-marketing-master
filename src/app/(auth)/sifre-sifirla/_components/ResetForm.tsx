'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { resetPasswordAction, type ResetErrorKey, type ResetSuccessKey } from '../actions'
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
  errorKey?: ResetErrorKey
  successKey?: ResetSuccessKey
}

const RESET_ERROR_I18N: Record<ResetErrorKey, string> = {
  resetErrorEmailRequired: 'auth.resetErrorEmailRequired',
  resetErrorGeneric: 'auth.resetErrorGeneric',
}

const RESET_SUCCESS_I18N: Record<ResetSuccessKey, string> = {
  resetSuccess: 'auth.resetSuccess',
}

export function ResetForm() {
  const { t } = useTranslation()
  const [state, action, pending] = useActionState<FormState, FormData>(
    resetPasswordAction,
    {},
  )

  if (state.successKey) {
    return (
      <div className="space-y-4">
        <div className={authSuccessClass}>
          {t(RESET_SUCCESS_I18N[state.successKey])}
        </div>
        <Link href="/giris" className={`block text-center text-sm ${authLinkSecondaryClass}`}>
          {t('auth.resetBackToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
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
          placeholder="sen@example.com"
          className={authInputClass}
        />
      </div>

      {state.errorKey && (
        <p className={authErrorClass}>
          {t(RESET_ERROR_I18N[state.errorKey])}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={authPrimaryBtnClass}
      >
        {pending ? t('auth.resetSubmitPending') : t('auth.resetSubmit')}
      </button>

      <p className={`text-center text-sm ${authMutedClass}`}>
        <Link href="/giris" className={authLinkSecondaryClass}>
          {t('auth.resetBackToLogin')}
        </Link>
      </p>
    </form>
  )
}
