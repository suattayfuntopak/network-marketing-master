'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Status = 'loading' | 'ready' | 'error'

export function PasswordResetGate() {
  const [status, setStatus] = useState<Status>('loading')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // PKCE flow: ?code= query param varsa client-side exchange yap
    const code = new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) setStatus('error')
        else setStatus('ready')
      })
      return
    }

    // Implicit flow: hash fragment'taki PASSWORD_RECOVERY event'ini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) setStatus('ready')
        if (event === 'SIGNED_IN' && session) setStatus('ready')
      }
    )

    // /auth/callback üzerinden session zaten kurulmuşsa
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ready')
    })

    const timer = setTimeout(() => {
      setStatus(s => s === 'loading' ? 'error' : s)
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
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
      setFormError('Şifre güncellenemedi. Yeni sıfırlama isteği gönder.')
      setSaving(false)
      return
    }
    router.push('/bugun')
  }

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#534AB7] border-t-transparent" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-[#FBEAF0] px-4 py-3 text-sm text-[#72243E]">
          Bağlantı süresi dolmuş veya geçersiz. Yeni sıfırlama isteği gönder.
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
        <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">
          {formError}
        </p>
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
