'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { lang } = useTranslation()

  useEffect(() => {
    console.error('[Dashboard error boundary]', error)
  }, [error])

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-10 md:pb-8 flex items-center justify-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15">
          <AlertTriangle className="h-8 w-8 text-rose-400" strokeWidth={1.75} />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-[var(--text-1)]">
            {lang === 'en' ? 'Something went wrong on this page' : 'Bu sayfada bir hata oluştu'}
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            {lang === 'en'
              ? 'The issue has been logged. Other sections of the app are unaffected — feel free to navigate elsewhere or retry.'
              : 'Hata kayıt altına alındı. Uygulamanın diğer bölümleri etkilenmedi — başka bir sayfaya geçebilir veya tekrar deneyebilirsin.'}
          </p>
        </div>

        <button
          onClick={reset}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/25 transition-colors"
        >
          {lang === 'en' ? 'Try again' : 'Tekrar dene'}
        </button>
      </div>
    </main>
  )
}
