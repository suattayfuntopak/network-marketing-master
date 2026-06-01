'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPasswordAction } from '../actions'
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
}

export function ResetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    resetPasswordAction,
    {}
  )

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className={authSuccessClass}>
          {state.success}
        </div>
        <Link href="/giris" className={`block text-center text-sm ${authLinkSecondaryClass}`}>
          Giriş sayfasına dön
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className={authLabelClass} htmlFor="email">
          E-posta
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
        {pending ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
      </button>

      <p className={`text-center text-sm ${authMutedClass}`}>
        <Link href="/giris" className={authLinkSecondaryClass}>
          Giriş sayfasına dön
        </Link>
      </p>
    </form>
  )
}
