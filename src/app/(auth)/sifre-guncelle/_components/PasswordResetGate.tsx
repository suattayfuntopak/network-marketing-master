'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'loading' | 'ready' | 'error'

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
  const [status, setStatus] = useState<Status>('loading')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

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
      setFormError('Şifre en az 6 karakter olmalı.')
      return
    }
    setSaving(true)
    setFormError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setFormError('Şifre güncellenemedi. Yeni sıfırlama bağlantısı iste.')
      setSaving(false)
      return
    }
    window.location.assign('/pano')
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
        <p className="text-xs text-gray-500">Bağlantı doğrulanıyor…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-[#FBEAF0] px-4 py-3 text-sm text-[#72243E]">
          Sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı iste.
        </p>
        <a
          href="/sifre-sifirla"
          className="block text-center text-sm font-semibold text-[#534AB7] hover:underline"
        >
          Yeni bağlantı iste
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-900" htmlFor="password">
          Yeni Şifre
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="En az 6 karakter"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
        />
      </div>

      {formError && (
        <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">{formError}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#453DA0] disabled:opacity-60"
      >
        {saving ? 'Kaydediliyor...' : 'Şifremi Güncelle'}
      </button>
    </form>
  )
}
