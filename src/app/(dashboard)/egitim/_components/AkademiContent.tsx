'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from '@/providers/LanguageProvider'
import { parseAkademiTab, akademiHref, type AkademiTab } from '@/lib/domain/akademiTab'
import { EgitimContent } from './EgitimContent'
import { VideolarContent } from './VideolarContent'
import { ItirazlarContent } from '@/app/(dashboard)/itirazlar/_components/ItirazlarContent'

const TABS: readonly { key: AkademiTab; labelKey: string; activeClass: string }[] = [
  { key: 'training', labelKey: 'akademi.tabContentBank', activeClass: 'bg-[#3730A3] text-white shadow-sm dark:bg-[#a5b4fc] dark:text-[#1e1b4b]' },
  { key: 'videos', labelKey: 'akademi.tabVideos', activeClass: 'bg-[#534AB7] text-white shadow-sm dark:bg-[#a09be8] dark:text-[#1e1b4b]' },
  { key: 'objections', labelKey: 'akademi.tabObjections', activeClass: 'bg-[#9B1D47] text-white shadow-sm dark:bg-[#fda4af] dark:text-[#3d0a1a]' },
]

export function AkademiContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = parseAkademiTab(searchParams.get('tab'))

  function selectTab(next: AkademiTab) {
    router.replace(akademiHref(next), { scroll: false })
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <header className="mb-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#1e1b4b]">
            <BookOpen className="h-5 w-5 text-[#3730A3] dark:text-[#a5b4fc]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('akademi.title')}</h1>
            <p className="text-sm text-[var(--text-2)]">{t('akademi.subtitle')}</p>
          </div>
        </div>

        <div
          className="mt-4 flex rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)]/80 p-1"
          role="tablist"
          aria-label={t('akademi.title')}
        >
          {TABS.map(({ key, labelKey, activeClass }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => selectTab(key)}
              className={clsx(
                'flex-1 rounded-xl px-2 py-2.5 text-xs font-bold transition sm:px-3 sm:text-sm',
                tab === key ? activeClass : 'text-[var(--text-2)] hover:text-[var(--text-1)]',
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </header>

      <div className={tab !== 'training'   ? 'hidden' : ''}><EgitimContent embedded /></div>
      <div className={tab !== 'videos'     ? 'hidden' : ''}><VideolarContent embedded /></div>
      <div className={tab !== 'objections' ? 'hidden' : ''}><ItirazlarContent embedded /></div>
    </main>
  )
}
