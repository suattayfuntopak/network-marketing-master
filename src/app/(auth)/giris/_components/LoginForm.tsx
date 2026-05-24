'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'
import { loginAction } from '../actions'

interface FormState {
  error?: string
}

export function LoginForm() {
  const { t } = useTranslation()
  const [state, action, pending] = useActionState<FormState, FormData>(
    loginAction,
    {}
  )

  return (
    <form action={action} className="space-y-5">
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
          autoComplete="current-password"
          placeholder="••••••••"
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
        {pending ? t('common.loading') : t('auth.loginBtn')}
      </button>

      <div className="space-y-2.5 pt-2 text-center text-xs">
        <p>
          <Link href="/sifre-sifirla" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
            {t('auth.resetPassword')}
          </Link>
        </p>

        <p className="text-gray-400">
          {t('auth.noAccount')}{' '}
          <Link href="/kayit" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline ml-1">
            {t('auth.registerTitle')}
          </Link>
        </p>
      </div>
    </form>
  )
}

