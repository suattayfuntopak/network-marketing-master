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

/**
 * Tüm sekmeler her zaman mount'lu — sadece aktif olmayan CSS ile gizlenir.
 * Bu sayede ilk yüklemede 6 query paralel başlar; sekme geçişi
 * unmount/remount + yeni fetch yerine anlık CSS değişimi olur.
 */
export function IlgilenHub() {
  const searchParams = useSearchParams()
  const raw = searchParams.get('tab')
  const activeTab: IlgilenTabId = isValidTab(raw) ? raw : 'daily'

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full md:mx-auto md:max-w-5xl">
        <IlgilenHubGrid activeTab={activeTab} />

        <div className={activeTab !== 'daily'   ? 'hidden' : 'mt-5'}><DailyTab /></div>
        <div className={activeTab !== 'live'    ? 'hidden' : 'mt-5'}><CrownVideoPage asTab /></div>
        <div className={activeTab !== 'team'    ? 'hidden' : 'mt-5'}><CrownEkibimPage asTab /></div>
        <div className={activeTab !== 'weekly'  ? 'hidden' : 'mt-5'}><CrownWeeklyPage asTab /></div>
        <div className={activeTab !== 'monthly' ? 'hidden' : 'mt-5'}><CrownMonthlyPage asTab /></div>
        <div className={activeTab !== 'first30' ? 'hidden' : 'mt-5'}><CrownFirst30Page asTab /></div>
      </div>
    </main>
  )
}
