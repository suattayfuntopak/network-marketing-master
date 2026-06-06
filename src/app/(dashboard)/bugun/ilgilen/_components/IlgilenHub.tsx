'use client'

import { useSearchParams } from 'next/navigation'
import { IlgilenHubGrid, ILGILEN_TAB_IDS, type IlgilenTabId } from './CrownHomeMockGrid'
import { DailyTab } from './DailyTab'
import { CrownVideoPage } from '@/app/(dashboard)/canli-egitim/_components/CrownVideoPage'
import { CrownEkibimPage } from '@/app/(dashboard)/ekibim/_components/CrownEkibimPage'
import { CrownWeeklyPage } from '@/app/(dashboard)/haftalik-ozet/_components/CrownWeeklyPage'
import { CrownMonthlyPage } from '@/app/(dashboard)/aylik-ozet/_components/CrownMonthlyPage'
import { CrownFirst30Page } from '@/app/(dashboard)/ilk-30-gun/_components/CrownFirst30Page'

function isValidTab(s: string | null): s is IlgilenTabId {
  return ILGILEN_TAB_IDS.includes(s as IlgilenTabId)
}

export function IlgilenHub() {
  const searchParams = useSearchParams()
  const raw = searchParams.get('tab')
  const activeTab: IlgilenTabId = isValidTab(raw) ? raw : 'daily'

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-5 md:mx-auto md:max-w-5xl">
        <IlgilenHubGrid activeTab={activeTab} />

        {activeTab === 'daily'   && <DailyTab />}
        {activeTab === 'live'    && <CrownVideoPage asTab />}
        {activeTab === 'team'    && <CrownEkibimPage asTab />}
        {activeTab === 'weekly'  && <CrownWeeklyPage asTab />}
        {activeTab === 'monthly' && <CrownMonthlyPage asTab />}
        {activeTab === 'first30' && <CrownFirst30Page asTab />}
      </div>
    </main>
  )
}
