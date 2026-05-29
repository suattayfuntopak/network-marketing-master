'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'

export function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    console.error('[Route error boundary]', error)
  }, [error])

  return (
    <main className="min-h-[50vh] w-full flex items-center justify-center px-4 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15">
          <AlertTriangle className="h-8 w-8 text-rose-400" strokeWidth={1.75} />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-[var(--text-1)]">
            {t('shellUi.errorTitle')}
          </h1>
          <p className="text-sm text-[var(--text-3)]">{t('shellUi.errorBody')}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/25 transition-colors"
        >
          {t('shellUi.tryAgain')}
        </button>
      </div>
    </main>
  )
}
