'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkAccentClass,
  authLinkSecondaryClass,
  authMutedClass,
  authPrimaryBtnClass,
} from '@/app/(auth)/_components/authUi'

export function LoginForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    router.prefetch('/pano')
  }, [router])

  // Zaten oturum açıksa (ör. yarım kalmış giriş) doğrudan panoya gönder
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/pano')
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    setPending(true)
    setError(undefined)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('E-posta veya şifre hatalı.')
      setPending(false)
      return
    }

    await supabase.auth.getSession()
    router.refresh()
    router.replace('/pano')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      {error && (
        <p className={authErrorClass}>
          {error}
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
