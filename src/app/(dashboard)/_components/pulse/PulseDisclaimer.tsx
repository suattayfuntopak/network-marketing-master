'use client'

import Link from 'next/link'
import { useTranslation } from '@/providers/LanguageProvider'

type Props = {
  comfortableTypography?: boolean
}

export function PulseDisclaimer({ comfortableTypography = false }: Props) {
  const { t } = useTranslation()

  return (
    <p
      className={`leading-relaxed italic text-[var(--text-3)] ${comfortableTypography ? 'text-sm' : 'text-[11px]'}`}
    >
      {t('pulse.disclaimer')}{' '}
      <Link href="/kvkk" className="font-semibold not-italic text-brand hover:underline">
        {t('pulse.disclaimerLink')}
      </Link>
    </p>
  )
}
