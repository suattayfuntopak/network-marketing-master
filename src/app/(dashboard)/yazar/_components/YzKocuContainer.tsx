'use client'
/* eslint-disable react-hooks/refs */

import { useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageSquare, HelpCircle, Target, Shield, PenLine } from 'lucide-react'
import { clsx } from 'clsx'
import { YazarForm } from './YazarForm'
import { KoclukForm } from './KoclukForm'
import { ProvaForm } from './ProvaForm'
import { StudyoForm } from './StudyoForm'
import { UyumContent } from '@/app/(dashboard)/uyum/_components/UyumContent'
import { useTranslation } from '@/providers/LanguageProvider'
import { parseYazarTab, type YazarTab } from '@/lib/domain/yazarTab'
import { EKIP_ACCENT_BTN_HOVER, EKIP_MODULE_ACCENT_CLASS } from '@/lib/ui/brandGradients'

interface YzKocuContainerProps {
  initialName: string
  initialNote: string
  initialWarmth: string
}

const TABS: readonly { key: YazarTab; icon: typeof MessageSquare; labelKey: string; activeClass: string }[] = [
  { key: 'yazar', icon: MessageSquare, labelKey: 'coachUi.tabMessage', activeClass: 'bg-[#0F6E56] text-white shadow-md' },
  { key: 'kocluk', icon: HelpCircle, labelKey: 'coachUi.tabCoaching', activeClass: 'bg-[#3730A3] text-white shadow-md' },
  { key: 'prova', icon: Target, labelKey: 'coachUi.tabProva', activeClass: 'bg-amber-600 text-white shadow-md' },
  { key: 'studyo', icon: PenLine, labelKey: 'coachUi.tabStudyo', activeClass: `${EKIP_MODULE_ACCENT_CLASS} ${EKIP_ACCENT_BTN_HOVER}` },
  { key: 'uyum', icon: Shield, labelKey: 'coachUi.tabCompliance', activeClass: 'bg-[#C03E1F] text-white shadow-md' },
]

export function YzKocuContainer({ initialName, initialNote, initialWarmth }: YzKocuContainerProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = parseYazarTab(searchParams.get('tab'))

  const visitedRef = useRef<Set<YazarTab>>(new Set([activeTab]))
  visitedRef.current.add(activeTab)
  const v = visitedRef.current

  function selectTab(tab: YazarTab) {
    const params = new URLSearchParams()
    if (tab !== 'yazar') params.set('tab', tab)
    const name = searchParams.get('name')
    const note = searchParams.get('note')
    const warmth = searchParams.get('warmth')
    if (name) params.set('name', name)
    if (note) params.set('note', note)
    if (warmth) params.set('warmth', warmth)
    const qs = params.toString()
    router.replace(qs ? `/yazar?${qs}` : '/yazar', { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div
        className="horizontal-scroll-lock no-swipe flex max-w-2xl mx-auto w-full overflow-x-auto rounded-2xl bg-[var(--bg-card)] p-1.5 border border-[var(--border)] shadow-sm scrollbar-none"
        role="tablist"
        aria-label={t('coachUi.pageTitle')}
        data-no-swipe="true"
        onTouchStart={e => e.stopPropagation()}
      >
        {TABS.map(({ key, icon: Icon, labelKey, activeClass }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            onClick={() => selectTab(key)}
            className={clsx(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 sm:flex-row sm:gap-2 rounded-xl py-2 px-1 sm:py-2.5 sm:px-2 text-[10px] sm:text-sm font-semibold leading-tight transition-all duration-200 active:scale-[0.98]',
              activeTab === key ? activeClass : 'text-[var(--text-2)] hover:bg-[var(--bg-subtle)]',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="text-center whitespace-normal line-clamp-2">{t(labelKey)}</span>
          </button>
        ))}
      </div>

      <div>
        {v.has('yazar')  && <div className={activeTab !== 'yazar'   ? 'hidden' : ''}><YazarForm initialName={initialName} initialNote={initialNote} initialWarmth={initialWarmth} /></div>}
        {v.has('kocluk') && <div className={activeTab !== 'kocluk'  ? 'hidden' : ''}><KoclukForm /></div>}
        {v.has('prova')  && <div className={activeTab !== 'prova'   ? 'hidden' : ''}><ProvaForm /></div>}
        {v.has('studyo') && <div className={activeTab !== 'studyo'  ? 'hidden' : ''}><StudyoForm /></div>}
        {v.has('uyum')   && <div className={activeTab !== 'uyum'    ? 'hidden' : ''}><UyumContent embedded /></div>}
      </div>
    </div>
  )
}
