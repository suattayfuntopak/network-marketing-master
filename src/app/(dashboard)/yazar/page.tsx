'use client'

import * as React from 'react'
import { Bot, Lock } from 'lucide-react'
import { YzKocuContainer } from './_components/YzKocuContainer'
import { useTranslation } from '@/providers/LanguageProvider'
import { parseYazarTab, type YazarTab } from '@/lib/domain/yazarTab'
import { formatTabbedPageTitle } from '@/lib/ui/tabbedPageTitle'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { useUpgradePrompt } from '@/hooks/useUpgradePrompt'
import { DashboardPageHeader } from '@/components/ui/DashboardPageHeader'
import { pageHeaderIconClass, PAGE_HEADER_ICON_GLYPH } from '@/lib/ui/pageHeaderIcon'

const YAZAR_TAB_LABEL_KEYS: Record<YazarTab, string> = {
  yazar: 'coachUi.tabMessage',
  kocluk: 'coachUi.tabCoaching',
  prova: 'coachUi.tabProva',
  studyo: 'coachUi.tabStudyo',
  uyum: 'coachUi.tabCompliance',
}

interface PageProps {
  searchParams: Promise<{ name?: string; note?: string; warmth?: string; tab?: string }>
}

export default function YazarPage({ searchParams }: PageProps) {
  const { t } = useTranslation()
  const { name, note, warmth, tab: tabParam } = React.use(searchParams)
  const activeTab = parseYazarTab(tabParam)
  const pageTitle = formatTabbedPageTitle(t('coachUi.pageTitle'), t(YAZAR_TAB_LABEL_KEYS[activeTab]))
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
        <DashboardPageHeader
          title={pageTitle}
          icon={<Bot className={PAGE_HEADER_ICON_GLYPH} strokeWidth={1.75} />}
          iconContainerClassName={pageHeaderIconClass('/yazar')}
          className=""
        />
        {hasAiCoachAccess ? (
          <YzKocuContainer initialName={name ?? ''} initialNote={note ?? ''} initialWarmth={warmth ?? 'ilik'} />
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center">
            <Lock className="mx-auto h-8 w-8 text-[var(--text-3)]" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-semibold text-[var(--text-1)]">{t('shellUi.upgradeAiCoachTitle')}</p>
            <button
              type="button"
              onClick={() => openUpgrade('ai_coach')}
              className="mt-4 rounded-xl brand-cta px-5 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-95 transition"
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
