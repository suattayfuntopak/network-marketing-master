'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { resetPasswordAction } from '../actions'

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
        <div className="rounded-xl bg-[#E1F5EE] px-4 py-4 text-sm text-[#0F6E56]">
          {state.success}
        </div>
        <Link href="/giris" className="block text-center text-sm font-semibold text-[#534AB7] hover:underline">
          Giriş sayfasına dön
        </Link>
      </div>
    )
  }

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
        {pending ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
      </button>

      <p className="text-center text-sm text-gray-500">
        <Link href="/giris" className="font-semibold text-[#534AB7] hover:underline">
          Giriş sayfasına dön
        </Link>
      </p>
    </form>
  )
}
