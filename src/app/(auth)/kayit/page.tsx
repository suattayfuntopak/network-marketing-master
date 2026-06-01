'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { authCardClass, authCardSubtitleClass, authCardTitleClass } from '@/app/(auth)/_components/authUi'
import { SignupForm } from './_components/SignupForm'

export default function KayitPage() {
  const { t } = useTranslation()

  return (
    <div className={authCardClass}>
      <h2 className={authCardTitleClass}>{t('auth.registerTitle')}</h2>
      <p className={authCardSubtitleClass}>{t('auth.welcome')}</p>
      <SignupForm />
    </div>
  )
}

