'use client'

import { CalendarDays } from 'lucide-react'
import { TakvimClient } from './_components/TakvimClient'
import { useTranslation } from '@/providers/LanguageProvider'
import { DashboardPageHeader } from '@/components/ui/DashboardPageHeader'

export default function TakvimPage() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <DashboardPageHeader
        title={t('pagesUi.calendarTitle')}
        subtitle={t('pagesUi.calendarSubtitle')}
        icon={<CalendarDays className="h-5 w-5 text-crown" strokeWidth={1.75} />}
        iconContainerClassName="bg-crown-subtle"
      />
      <TakvimClient />
    </main>
  )
}

