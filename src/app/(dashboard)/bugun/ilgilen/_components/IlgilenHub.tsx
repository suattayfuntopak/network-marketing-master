'use client'

import { useRef } from 'react'
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

  // Lazy mount: ilk ziyaret edildiğinde mount et, sonra asla unmount etme.
  // Başlangıçta sadece aktif sekme render edilir → ilk yükleme hafif.
  // Sekme geçişi: zaten mount'lu → anlık CSS değişimi, sıfır network isteği.
  const visitedRef = useRef<Set<IlgilenTabId>>(new Set([activeTab]))
  visitedRef.current.add(activeTab)
  const v = visitedRef.current

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full md:mx-auto md:max-w-5xl">
        <IlgilenHubGrid activeTab={activeTab} />

        {v.has('daily')   && <div className={activeTab !== 'daily'   ? 'hidden' : 'mt-5'}><DailyTab /></div>}
        {v.has('live')    && <div className={activeTab !== 'live'    ? 'hidden' : 'mt-5'}><CrownVideoPage asTab /></div>}
        {v.has('team')    && <div className={activeTab !== 'team'    ? 'hidden' : 'mt-5'}><CrownEkibimPage asTab /></div>}
        {v.has('weekly')  && <div className={activeTab !== 'weekly'  ? 'hidden' : 'mt-5'}><CrownWeeklyPage asTab /></div>}
        {v.has('monthly') && <div className={activeTab !== 'monthly' ? 'hidden' : 'mt-5'}><CrownMonthlyPage asTab /></div>}
        {v.has('first30') && <div className={activeTab !== 'first30' ? 'hidden' : 'mt-5'}><CrownFirst30Page asTab /></div>}
      </div>
    </main>
  )
}
