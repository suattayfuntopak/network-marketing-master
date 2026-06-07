'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { PanoInviteChip } from './PanoInviteChip'

interface Props {
  inviteCode: string
}

export function PanoFooter({ inviteCode }: Props) {
  const { t } = useTranslation()

  return (
    <footer className="mt-2 shrink-0 space-y-2 pb-1 md:mt-3">
      <Link
        href="/ekip"
        className="flex min-h-10 items-center justify-center gap-1 text-xs font-semibold text-[var(--text-2)] transition hover:text-[#534AB7] md:text-sm"
      >
        {t('dashboard.panoTeamLink')}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
      <PanoInviteChip inviteCode={inviteCode} show={!!inviteCode.trim()} />
    </footer>
  )
}
