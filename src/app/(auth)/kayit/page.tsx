'use client'

import { Suspense } from 'react'
import { useTranslation } from '@/providers/LanguageProvider'
import { authCardClass, authCardSubtitleClass, authCardTitleClass } from '@/app/(auth)/_components/authUi'
import { SignupForm } from './_components/SignupForm'

export default function KayitPage() {
  const { t } = useTranslation()

  return (
    <div className={authCardClass}>
      <h2 className={authCardTitleClass}>{t('auth.registerTitle')}</h2>
      <p className={authCardSubtitleClass}>{t('auth.welcome')}</p>
      <Suspense fallback={<p className="text-sm text-[var(--text-3)]">{t('common.loading')}</p>}>
        <SignupForm />
      </Suspense>
    </div>
  )
}

