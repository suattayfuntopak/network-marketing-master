'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/providers/LanguageProvider'
import {
  authCardClass,
  authCardSubtitleClass,
  authCardTitleClass,
  authErrorClass,
} from '@/app/(auth)/_components/authUi'
import { ResetForm } from './_components/ResetForm'

function SifreSifirlaContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className={authCardClass}>
      <h2 className={authCardTitleClass}>{t('auth.resetPageTitle')}</h2>
      <p className={authCardSubtitleClass}>{t('auth.resetPageSubtitle')}</p>
      {error && (
        <div className={`mb-4 ${authErrorClass}`}>
          {error === 'link_gecersiz'
            ? t('auth.resetPageLinkInvalid')
            : decodeURIComponent(error)}
        </div>
      )}
      <ResetForm />
    </div>
  )
}

export default function SifreSifirlaPage() {
  const { t } = useTranslation()

  return (
    <Suspense fallback={<p className="text-sm text-[var(--text-3)]">{t('common.loading')}</p>}>
      <SifreSifirlaContent />
    </Suspense>
  )
}
