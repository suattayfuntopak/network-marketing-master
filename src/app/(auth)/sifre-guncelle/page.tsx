'use client'

import { useTranslation } from '@/providers/LanguageProvider'
import { authCardClass, authCardSubtitleClass, authCardTitleClass } from '@/app/(auth)/_components/authUi'
import { PasswordResetGate } from './_components/PasswordResetGate'

export default function SifreGuncelePage() {
  const { t } = useTranslation()

  return (
    <div className={authCardClass}>
      <h2 className={authCardTitleClass}>{t('auth.updatePasswordTitle')}</h2>
      <p className={authCardSubtitleClass}>{t('auth.updatePasswordSubtitle')}</p>
      <PasswordResetGate />
    </div>
  )
}
