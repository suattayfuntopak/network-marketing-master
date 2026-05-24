'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { signupAction } from '../actions'

interface FormState {
  error?: string
  success?: string
}

export function SignupForm() {
  const { t } = useTranslation()
  const [state, action, pending] = useActionState<FormState, FormData>(
    signupAction,
    {}
  )

  if (state.success) {
    return (
      <div className="rounded-xl bg-[#E1F5EE]/10 border border-[#0F6E56]/20 px-4 py-4 text-sm text-emerald-300">
        {state.success}
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300" htmlFor="fullName">
          {t('auth.nameLabel')}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          placeholder="John Doe"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300" htmlFor="email">
          {t('auth.emailLabel')}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="email@example.com"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-300" htmlFor="password">
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
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
        />
      </div>

      {state.error && (
        <p className="rounded-xl bg-[#FBEAF0]/10 border border-[#72243E]/20 px-4 py-2.5 text-sm text-rose-300">
          {t('auth.errorOccured')}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_20px_rgba(6,182,212,0.25)]"
      >
        {pending ? t('common.loading') : t('auth.registerBtn')}
      </button>

      <div className="pt-2 text-center text-xs text-gray-400">
        {t('auth.hasAccount')}{' '}
        <Link href="/giris" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline ml-1">
          {t('auth.loginTitle')}
        </Link>
      </div>
    </form>
  )
}

