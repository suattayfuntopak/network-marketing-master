'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Root error boundary]', error)
  }, [error])

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 py-10 flex items-center justify-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15">
          <AlertCircle className="h-8 w-8 text-rose-400" strokeWidth={1.75} />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-[var(--text-1)]">
            Beklenmedik bir hata oluştu
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            Sorunu kayıt altına aldık. Lütfen sayfayı yenileyin veya tekrar deneyin.
          </p>
        </div>

        <div className="w-full border-t border-rose-500/20" />

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-1)]">
            Something went wrong
          </h2>
          <p className="text-sm text-[var(--text-3)]">
            We&apos;ve logged the issue. Please refresh the page or try again.
          </p>
        </div>

        <button
          onClick={reset}
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-rose-500/15 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/25 transition-colors"
        >
          Tekrar dene / Try again
        </button>
      </div>
    </main>
  )
}
