'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { authCardClass, authCardSubtitleClass, authCardTitleClass } from '@/app/(auth)/_components/authUi'
import { LoginForm } from './_components/LoginForm'

export default function GirisPage() {
  const { t } = useTranslation()

  return (
    <div className={authCardClass}>
      <h2 className={authCardTitleClass}>{t('auth.loginTitle')}</h2>
      <p className={authCardSubtitleClass}>{t('auth.welcome')}</p>
      <LoginForm />
    </div>
  )
}

