'use client'
/* eslint-disable react-hooks/refs */

import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { parseAkademiTab, akademiHref, type AkademiTab } from '@/lib/domain/akademiTab'
import { EgitimContent } from './EgitimContent'
import { VideolarContent } from './VideolarContent'
import { ItirazlarContent } from '@/app/(dashboard)/itirazlar/_components/ItirazlarContent'
import { AkademiTabLabel } from '@/components/ui/AkademiTabLabel'
import { AKADEMI_TAB_THEME, AKADEMI_TABS } from '@/lib/ui/akademiTabTheme'
import { formatTabbedPageTitle } from '@/lib/ui/tabbedPageTitle'
import { PageHelp, PAGE_HELP_HEADER_TRIGGER_CLASS } from '@/components/ui/PageHelp'
import { pageHeaderIconClass, PAGE_HEADER_ICON_GLYPH } from '@/lib/ui/pageHeaderIcon'

import { useWorkspace } from '@/hooks/useWorkspace'

export function AkademiContent() {
  const { t } = useTranslation()
  const { data: ws } = useWorkspace()
  const isSuperAdmin = !!ws?.isSuperAdmin
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = parseAkademiTab(searchParams.get('tab'))
  const [trainingFormOpen, setTrainingFormOpen] = useState(false)
  const [videoFormOpen, setVideoFormOpen] = useState(false)
  const [objectionFormOpen, setObjectionFormOpen] = useState(false)

  const visitedRef = useRef<Set<AkademiTab>>(new Set([tab]))
  visitedRef.current.add(tab)
  const v = visitedRef.current

  function selectTab(next: AkademiTab) {
    router.replace(akademiHref(next), { scroll: false })
  }

  const addButtonClass = (theme: keyof typeof AKADEMI_TAB_THEME) =>
    clsx(
      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition active:scale-95 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3.5 sm:py-2 sm:text-sm sm:font-bold',
      AKADEMI_TAB_THEME[theme].addButtonClass,
    )

  const addButton = isSuperAdmin ? (
    tab === 'training' ? (
      <button
        type="button"
        onClick={() => setTrainingFormOpen(true)}
        aria-label={t('trainingPage.addContent')}
        className={addButtonClass('training')}
      >
        <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        <span className="hidden sm:inline">{t('trainingPage.addContent')}</span>
      </button>
    ) : tab === 'videos' ? (
      <button
        type="button"
        onClick={() => setVideoFormOpen(true)}
        aria-label={t('videoTraining.addVideoShort')}
        className={addButtonClass('videos')}
      >
        <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        <span className="hidden sm:inline">{t('videoTraining.addVideoShort')}</span>
      </button>
    ) : tab === 'objections' ? (
      <button
        type="button"
        onClick={() => setObjectionFormOpen(true)}
        aria-label={t('objectionsPage.addObjection')}
        className={addButtonClass('objections')}
      >
        <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        <span className="hidden sm:inline">{t('objectionsPage.addObjection')}</span>
      </button>
    ) : null
  ) : null

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', pageHeaderIconClass('/egitim'))}>
              <BookOpen className={PAGE_HEADER_ICON_GLYPH} strokeWidth={1.75} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-1)]">
              {/* Mobilde kısa sekme etiketi (Vaktin Varsa / Kütüphane); masaüstü tam etiket, dokunulmadı */}
              <span className="sm:hidden">
                {formatTabbedPageTitle(
                  t('akademi.title'),
                  t(AKADEMI_TABS.find(row => row.key === tab)?.labelKeyMobile ?? 'akademi.tabContentBankShort'),
                )}
              </span>
              <span className="hidden sm:inline">
                {formatTabbedPageTitle(
                  t('akademi.title'),
                  t(AKADEMI_TABS.find(row => row.key === tab)?.labelKey ?? 'akademi.tabContentBank'),
                )}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PageHelp triggerClassName={PAGE_HELP_HEADER_TRIGGER_CLASS} />
            {addButton}
          </div>
        </div>

        <div
          className="horizontal-scroll-lock no-swipe mt-4 flex rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)]/80 p-1"
          role="tablist"
          aria-label={t('akademi.title')}
          data-no-swipe="true"
          onTouchStart={e => e.stopPropagation()}
        >
          {AKADEMI_TABS.map(({ key }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => selectTab(key)}
              className={clsx(
                'flex-1 whitespace-nowrap rounded-xl px-1.5 py-2.5 text-[11px] font-bold transition sm:px-3 sm:text-sm',
                tab === key ? AKADEMI_TAB_THEME[key].activeTabClass : 'text-[var(--text-2)] hover:text-[var(--text-1)]',
              )}
            >
              <AkademiTabLabel tab={key} />
            </button>
          ))}
        </div>
      </header>

      {v.has('training') && (
        <div className={tab !== 'training' ? 'hidden' : ''}>
          <EgitimContent embedded addFormOpen={trainingFormOpen} onAddFormOpenChange={setTrainingFormOpen} />
        </div>
      )}
      {v.has('videos') && (
        <div className={tab !== 'videos' ? 'hidden' : ''}>
          <VideolarContent embedded addFormOpen={videoFormOpen} onAddFormOpenChange={setVideoFormOpen} />
        </div>
      )}
      {v.has('objections') && (
        <div className={tab !== 'objections' ? 'hidden' : ''}>
          <ItirazlarContent embedded addFormOpen={objectionFormOpen} onAddFormOpenChange={setObjectionFormOpen} />
        </div>
      )}
    </main>
  )
}
