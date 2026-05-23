'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '../actions'

interface FormState {
  error?: string
}

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    loginAction,
    {}
  )

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-900" htmlFor="email">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="sen@example.com"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-900" htmlFor="password">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none transition focus:border-[#534AB7] focus:ring-2 focus:ring-[#EEEDFE]"
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#453DA0] disabled:opacity-60"
      >
        {pending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Hesabın yok mu?{' '}
        <Link href="/kayit" className="font-semibold text-[#534AB7] hover:underline">
          Kayıt ol
        </Link>
      </p>
    </form>
  )
}
