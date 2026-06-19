'use client'

import { CalendarDays } from 'lucide-react'
import { TakvimClient } from './_components/TakvimClient'
import { useTranslation } from '@/providers/LanguageProvider'
import { DashboardPageHeader } from '@/components/ui/DashboardPageHeader'
import { pageHeaderIconClass, PAGE_HEADER_ICON_GLYPH } from '@/lib/ui/pageHeaderIcon'

export default function TakvimPage() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <DashboardPageHeader
        title={t('pagesUi.calendarTitle')}
        subtitle={t('pagesUi.calendarSubtitle')}
        icon={<CalendarDays className={PAGE_HEADER_ICON_GLYPH} strokeWidth={1.75} />}
        iconContainerClassName={pageHeaderIconClass('/takvim')}
        rowOnMobile
      />
      <TakvimClient />
    </main>
  )
}

