'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Users } from 'lucide-react'
import { EkipPanel } from './EkipPanel'
import { EkipTabNav, ekipTabLabel, resolveEkipTab, type EkipTabId } from './EkipTabNav'
import { hubPeriodTabLabel, parseSummaryTab } from '@/components/hub/HubSummaryTabBar'
import { formatTabbedPageTitle } from '@/lib/ui/tabbedPageTitle'
import { useTranslation } from '@/providers/LanguageProvider'

import { PageHelp } from '@/components/ui/PageHelp'
import { pageHeaderIconClass, PAGE_HEADER_ICON_GLYPH } from '@/lib/ui/pageHeaderIcon'

export function EkipPageContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const raw = searchParams.get('tab')
  const activeTab: EkipTabId = resolveEkipTab(raw)
  const periodTab = parseSummaryTab(searchParams.get('period'))
  const pageTitle =
    activeTab === 'summary'
      ? formatTabbedPageTitle(
          t('team.title'),
          ekipTabLabel(t, activeTab),
          hubPeriodTabLabel(t, periodTab),
        )
      : formatTabbedPageTitle(t('team.title'), ekipTabLabel(t, activeTab))

  useEffect(() => {
    if (raw === 'team') router.replace('/ekip?tab=members', { scroll: false })
    else if (raw === 'activity') router.replace('/ekip?tab=summary', { scroll: false })
    else if (raw === 'invite' || raw === 'tools') router.replace('/ekip?tab=members', { scroll: false })
  }, [raw, router])

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${pageHeaderIconClass('/ekip')}`}>
          <Users className={PAGE_HEADER_ICON_GLYPH} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-[var(--text-1)]">{pageTitle}</h1>
        </div>
        <PageHelp />
      </header>
      <EkipTabNav activeTab={activeTab} />
      <EkipPanel activeTab={activeTab} />
    </main>
  )
}
