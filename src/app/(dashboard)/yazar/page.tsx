'use client'

import * as React from 'react'
import { Bot } from 'lucide-react'
import { YzKocuContainer } from './_components/YzKocuContainer'
import { useTranslation } from '@/providers/LanguageProvider'

interface PageProps {
  searchParams: Promise<{ name?: string; note?: string; warmth?: string }>
}

export default function YazarPage({ searchParams }: PageProps) {
  const { t } = useTranslation()
  const { name, note, warmth } = React.use(searchParams)

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-6">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] dark:bg-[#1e1b4b]">
            <Bot className="h-5 w-5 text-[#3730A3] dark:text-[#a5b4fc]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">
              {t('coachUi.pageTitle')}
            </h1>
          </div>
        </header>
        <YzKocuContainer initialName={name ?? ''} initialNote={note ?? ''} initialWarmth={warmth ?? 'ilik'} />
      </div>
    </main>
  )
}

