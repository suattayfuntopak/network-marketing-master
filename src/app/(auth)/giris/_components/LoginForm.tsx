'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { loginAction } from '../actions'
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkAccentClass,
  authLinkSecondaryClass,
  authMutedClass,
  authPrimaryBtnClass,
} from '@/app/(auth)/_components/authUi'

interface FormState {
  error?: string
}

export function LoginForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {})

  useEffect(() => {
    router.prefetch('/pano')
  }, [router])

  return (
    <form action={action} className="space-y-5">
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
          autoComplete="current-password"
          placeholder="••••••••"
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
        {pending ? t('common.loading') : t('auth.loginBtn')}
      </button>

      <div className="space-y-2.5 pt-2 text-center text-xs">
        <p>
          <Link href="/sifre-sifirla" className={authLinkAccentClass}>
            {t('auth.resetPassword')}
          </Link>
        </p>

        <p className={authMutedClass}>
          {t('auth.noAccount')}{' '}
          <Link href="/kayit" className={`${authLinkSecondaryClass} ml-1`}>
            {t('auth.registerTitle')}
          </Link>
        </p>
      </div>
    </form>
  )
}
