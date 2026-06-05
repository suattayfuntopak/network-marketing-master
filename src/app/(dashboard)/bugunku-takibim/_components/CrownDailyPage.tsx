'use client'

import { ClipboardList } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { HubPageShell } from '@/lib/ui/hub/HubPageShell'
import { HedefKart } from '@/app/(dashboard)/pano/_components/HedefKart'
import { FieldWeekSummary } from '@/app/(dashboard)/_components/pulse/FieldWeekSummary'
import { TodayRitualSection } from '@/app/(dashboard)/bugun/ilgilen/_components/TodayRitualSection'

/** Bugünkü takip — NMM hedef + saha + gün ritüeli bileşenleri (gerçek veri). */
export function CrownDailyPage() {
  const { t } = useTranslation()

  return (
    <HubPageShell
      title={t('dashboard.crownMockDailyFollow')}
      subtitle={t('crown.dailySubtitle')}
      icon={ClipboardList}
      iconClassName="bg-[#EEEDFE] text-[#534AB7] dark:bg-[#1e1b4b] dark:text-[#a5b4fc]"
    >
      <HedefKart />
      <FieldWeekSummary />
      <TodayRitualSection />
    </HubPageShell>
  )
}
