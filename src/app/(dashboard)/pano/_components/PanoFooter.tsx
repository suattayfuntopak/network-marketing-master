'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { PanoInviteChip } from './PanoInviteChip'

interface Props {
  inviteCode: string
}

export function PanoFooter({ inviteCode }: Props) {
  const { t } = useTranslation()
  const { hasTeamFullAccess } = useFeatureAccess()
  const { openUpgrade, UpgradePrompt } = useUpgradePrompt()

  return (
    <footer className="mt-2 shrink-0 space-y-2 pb-1 md:mt-3">
      <Link
        href="/ekip"
        className="flex min-h-10 items-center justify-center gap-1 text-xs font-semibold text-[var(--text-2)] transition hover:text-brand md:text-sm"
      >
        {t('dashboard.panoTeamLink')}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
      <PanoInviteChip inviteCode={inviteCode} show={!!inviteCode.trim()} />
      {!hasTeamFullAccess && (
        <button
          type="button"
          onClick={() => openUpgrade('team')}
          className="flex w-full min-h-10 items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400 md:text-sm"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
          {t('dashboard.panoTeamUpgradeHint')}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
      {UpgradePrompt}
    </footer>
  )
}
