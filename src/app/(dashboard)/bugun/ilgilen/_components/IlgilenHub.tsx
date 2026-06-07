'use client'

import { useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { IlgilenHubGrid, ILGILEN_TAB_IDS, type IlgilenTabId } from './CrownHomeMockGrid'
import { DailyTab } from './DailyTab'
import { CrownVideoPage } from '@/app/(dashboard)/canli-egitim/_components/CrownVideoPage'
import { CrownWeeklyPage } from '@/app/(dashboard)/haftalik-ozet/_components/CrownWeeklyPage'
import { CrownMonthlyPage } from '@/app/(dashboard)/aylik-ozet/_components/CrownMonthlyPage'
import { CrownFirst30Page } from '@/app/(dashboard)/ilk-30-gun/_components/CrownFirst30Page'
import { HedefKart } from '@/app/(dashboard)/pano/_components/HedefKart'

function isValidTab(s: string | null): s is IlgilenTabId {
  return ILGILEN_TAB_IDS.includes(s as IlgilenTabId)
}

/**
 * ?tab= URL ile sekme kalıcılığı kasıtlıdır: sayfa yenilendiğinde son açık sekme korunur.
 * Varsayılan `daily`; geçersiz param yine daily'ye düşer.
 */
export function IlgilenHub() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const raw = searchParams.get('tab')
  const activeTab: IlgilenTabId = isValidTab(raw) ? raw : 'daily'

  useEffect(() => {
    if (raw === 'team') router.replace('/ekip', { scroll: false })
    if (raw === 'daily') router.replace('/bugunku-takibim', { scroll: false })
  }, [raw, router])

  // Lazy mount: ilk ziyaret edildiğinde mount et, sonra asla unmount etme.
  // Başlangıçta sadece aktif sekme render edilir → ilk yükleme hafif.
  // Sekme geçişi: zaten mount'lu → anlık CSS değişimi, sıfır network isteği.
  const visitedRef = useRef<Set<IlgilenTabId>>(new Set([activeTab]))
  visitedRef.current.add(activeTab)
  const v = visitedRef.current

  return (
    <main className="min-h-screen w-full bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-5">
        <IlgilenHubGrid activeTab={activeTab} />

        {v.has('roadmap') && <div className={activeTab !== 'roadmap' ? 'hidden' : 'mt-5'}><HedefKart /></div>}
        {v.has('daily')   && <div className={activeTab !== 'daily'   ? 'hidden' : 'mt-5'}><DailyTab /></div>}
        {v.has('weekly')  && <div className={activeTab !== 'weekly'  ? 'hidden' : 'mt-5'}><CrownWeeklyPage asTab /></div>}
        {v.has('monthly') && <div className={activeTab !== 'monthly' ? 'hidden' : 'mt-5'}><CrownMonthlyPage asTab /></div>}
        {v.has('first30') && <div className={activeTab !== 'first30' ? 'hidden' : 'mt-5'}><CrownFirst30Page asTab /></div>}
        {v.has('live')    && <div className={activeTab !== 'live'    ? 'hidden' : 'mt-5'}><CrownVideoPage asTab /></div>}
      </div>
    </main>
  )
}
