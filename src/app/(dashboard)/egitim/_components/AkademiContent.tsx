'use client'
/* eslint-disable react-hooks/refs */

import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { useWorkspace } from '@/hooks/useWorkspace'
import { parseAkademiTab, akademiHref, type AkademiTab } from '@/lib/domain/akademiTab'
import { EgitimContent } from './EgitimContent'
import { VideolarContent } from './VideolarContent'
import { ItirazlarContent } from '@/app/(dashboard)/itirazlar/_components/ItirazlarContent'
import { akademiAccent } from './akademiTheme'
import { AKADEMI_TAB_THEME, AKADEMI_TABS } from '@/lib/ui/akademiTabTheme'
import { formatTabbedPageTitle } from '@/lib/ui/tabbedPageTitle'

export function AkademiContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: ws } = useWorkspace()
  const tab = parseAkademiTab(searchParams.get('tab'))
  const isAdmin = !!ws?.isSuperAdmin

  const [trainingFormOpen, setTrainingFormOpen] = useState(false)
  const [videoFormOpen, setVideoFormOpen] = useState(false)
  const [objectionFormOpen, setObjectionFormOpen] = useState(false)

  const visitedRef = useRef<Set<AkademiTab>>(new Set([tab]))
  visitedRef.current.add(tab)
  const v = visitedRef.current

  function selectTab(next: AkademiTab) {
    router.replace(akademiHref(next), { scroll: false })
  }

  const addButton =
    tab === 'training' ? (
      <button
        type="button"
        onClick={() => setTrainingFormOpen(true)}
        className={clsx(
          'flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold shadow-sm transition active:scale-95',
          AKADEMI_TAB_THEME.training.addButtonClass,
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{t('trainingPage.addContent')}</span>
      </button>
    ) : tab === 'videos' && isAdmin ? (
      <button
        type="button"
        onClick={() => setVideoFormOpen(true)}
        className={clsx(
          'flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold shadow-sm transition active:scale-95',
          AKADEMI_TAB_THEME.videos.addButtonClass,
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{t('videoTraining.addVideoShort')}</span>
      </button>
    ) : tab === 'objections' ? (
      <button
        type="button"
        onClick={() => setObjectionFormOpen(true)}
        className={clsx(
          'flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold shadow-sm transition active:scale-95',
          AKADEMI_TAB_THEME.objections.addButtonClass,
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{t('objectionsPage.addObjection')}</span>
      </button>
    ) : null

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', akademiAccent.icon)}>
              <BookOpen className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-1)]">
              {formatTabbedPageTitle(
                t('akademi.title'),
                t(AKADEMI_TABS.find(row => row.key === tab)?.labelKey ?? 'akademi.tabContentBank'),
              )}
            </h1>
          </div>
          {addButton}
        </div>

        <div
          className="horizontal-scroll-lock no-swipe mt-4 flex rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)]/80 p-1"
          role="tablist"
          aria-label={t('akademi.title')}
          data-no-swipe="true"
          onTouchStart={e => e.stopPropagation()}
        >
          {AKADEMI_TABS.map(({ key, labelKey }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => selectTab(key)}
              className={clsx(
                'flex-1 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:px-3 sm:text-sm',
                tab === key ? AKADEMI_TAB_THEME[key].activeTabClass : 'text-[var(--text-2)] hover:text-[var(--text-1)]',
              )}
            >
              {t(labelKey)}
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
