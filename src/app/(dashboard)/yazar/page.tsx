'use client'

import * as React from 'react'
import { Bot, Lock } from 'lucide-react'
import { YzKocuContainer } from './_components/YzKocuContainer'
import { useTranslation } from '@/providers/LanguageProvider'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'

interface PageProps {
  searchParams: Promise<{ name?: string; note?: string; warmth?: string }>
}

export default function YazarPage({ searchParams }: PageProps) {
  const { t } = useTranslation()
  const { name, note, warmth } = React.use(searchParams)
  const { hasAiCoachAccess } = useFeatureAccess()
  const { openUpgrade, UpgradePrompt } = useUpgradePrompt()

  React.useEffect(() => {
    if (!hasAiCoachAccess) {
      openUpgrade('ai_coach')
    }
  }, [hasAiCoachAccess, openUpgrade])

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-6">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#1e1b4b]">
            <Bot className="h-5 w-5 text-[#3730A3] dark:text-[#a5b4fc]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">
              {t('coachUi.pageTitle')}
            </h1>
          </div>
        </header>
        {hasAiCoachAccess ? (
          <YzKocuContainer initialName={name ?? ''} initialNote={note ?? ''} initialWarmth={warmth ?? 'ilik'} />
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center">
            <Lock className="mx-auto h-8 w-8 text-[var(--text-3)]" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-semibold text-[var(--text-1)]">{t('shellUi.upgradeAiCoachTitle')}</p>
            <button
              type="button"
              onClick={() => openUpgrade('ai_coach')}
              className="mt-4 rounded-xl bg-gradient-to-r from-[#534AB7] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
            >
              {t('shellUi.upgradeBannerCta')}
            </button>
          </div>
        )}
      </div>
      {UpgradePrompt}
    </main>
  )
}
