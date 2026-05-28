'use client'

import { Target } from 'lucide-react'
import { ProvaForm } from '../yazar/_components/ProvaForm'
import { useTranslation } from '@/providers/LanguageProvider'

export default function SahaProvasiPage() {
  const { t } = useTranslation()

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-6">
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Target className="h-5 w-5 text-amber-600" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">
              {t('pagesUi.fieldRehearsalTitle')}
            </h1>
            <p className="text-sm text-[var(--text-2)]">
              {t('pagesUi.fieldRehearsalSubtitle')}
            </p>
          </div>
        </header>
        <ProvaForm />
      </div>
    </main>
  )
}
