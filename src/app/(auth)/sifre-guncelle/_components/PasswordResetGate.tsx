'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkSecondaryClass,
  authMutedClass,
  authPrimaryBtnClass,
} from '@/app/(auth)/_components/authUi'

type Status = 'loading' | 'ready' | 'error'

type FormErrorKey = 'updatePasswordErrorShort' | 'updatePasswordErrorFailed'

// i18n:unused tarayıcısı literal anahtarları görsün diye.
const FORM_ERROR_I18N: Record<FormErrorKey, string> = {
  updatePasswordErrorShort: 'auth.updatePasswordErrorShort',
  updatePasswordErrorFailed: 'auth.updatePasswordErrorFailed',
}

/** E-posta linkindeki token/code/hash → sunucu callback veya setSession. */
function buildCallbackUrl(params: URLSearchParams): string | null {
  const code = params.get('code')
  if (code) {
    return `/auth/callback?code=${encodeURIComponent(code)}&next=/sifre-guncelle`
  }

  const tokenHash = params.get('token_hash') ?? params.get('token')
  const type = params.get('type')
  if (tokenHash && type) {
    return `/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=/sifre-guncelle`
  }

  return null
}

export function PasswordResetGate() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<Status>('loading')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [formErrorKey, setFormErrorKey] = useState<FormErrorKey | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function init() {
      const query = new URLSearchParams(window.location.search)
      const callbackFromQuery = buildCallbackUrl(query)
      if (callbackFromQuery) {
        window.location.replace(callbackFromQuery)
        return
      }

      const hashRaw = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
      if (hashRaw) {
        const hashParams = new URLSearchParams(hashRaw)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          window.history.replaceState(null, '', '/sifre-guncelle')
          if (!cancelled) setStatus(error ? 'error' : 'ready')
          return
        }

        const callbackFromHash = buildCallbackUrl(hashParams)
        if (callbackFromHash) {
          window.location.replace(callbackFromHash)
          return
        }
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        if (!cancelled) setStatus('ready')
        return
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (
          nextSession &&
          (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION')
        ) {
          if (!cancelled) setStatus('ready')
        }
      })

      const timer = window.setTimeout(() => {
        if (!cancelled) setStatus(s => (s === 'loading' ? 'error' : s))
      }, 12_000)

      return () => {
        subscription.unsubscribe()
        window.clearTimeout(timer)
      }
    }

    let cleanup: (() => void) | void
    init().then(c => {
      cleanup = c
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setFormErrorKey('updatePasswordErrorShort')
      return
    }
    setSaving(true)
    setFormErrorKey(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setFormErrorKey('updatePasswordErrorFailed')
      setSaving(false)
      return
    }
    window.location.assign('/pano')
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className={`text-xs ${authMutedClass}`}>{t('auth.updatePasswordVerifying')}</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <p className={authErrorClass}>{t('auth.updatePasswordLinkInvalid')}</p>
        <Link
          href="/sifre-sifirla"
          className={`block text-center text-sm ${authLinkSecondaryClass}`}
        >
          {t('auth.updatePasswordRequestNewLink')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={authLabelClass} htmlFor="password">
          {t('auth.updatePasswordLabel')}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder={t('auth.updatePasswordPlaceholder')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={authInputClass}
        />
      </div>

      {formErrorKey && (
        <p className={authErrorClass}>{t(FORM_ERROR_I18N[formErrorKey])}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className={authPrimaryBtnClass}
      >
        {saving ? t('auth.updatePasswordSubmitPending') : t('auth.updatePasswordSubmit')}
      </button>
    </form>
  )
}
