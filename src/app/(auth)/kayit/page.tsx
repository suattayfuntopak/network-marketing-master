'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { SignupForm } from './_components/SignupForm'

export default function KayitPage() {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161824]/60 p-8 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="mb-1 text-xl font-bold text-white">{t('auth.registerTitle')}</h2>
      <p className="mb-6 text-sm text-gray-400">{t('auth.welcome')}</p>
      <SignupForm />
    </div>
  )
}

