'use client'

import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'

export function PulseDisclaimer() {
  const { t } = useTranslation()

  return (
    <p className="text-[11px] leading-relaxed italic text-[var(--text-3)]">
      {t('pulse.disclaimer')}{' '}
      <Link href="/kvkk" className="font-semibold not-italic text-brand hover:underline">
        {t('pulse.disclaimerLink')}
      </Link>
    </p>
  )
}
