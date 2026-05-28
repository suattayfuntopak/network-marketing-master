import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 py-10 flex items-center justify-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/15">
          <Compass className="h-8 w-8 text-indigo-400" strokeWidth={1.75} />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-[var(--text-1)]">
            Sayfa bulunamadı
          </h1>
          <p className="text-sm text-[var(--text-3)]">
            Aradığın sayfa taşınmış veya silinmiş olabilir.
          </p>
        </div>

        <div className="w-full border-t border-indigo-500/20" />

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-[var(--text-1)]">
            Page not found
          </h2>
          <p className="text-sm text-[var(--text-3)]">
            The page you&apos;re looking for may have been moved or removed.
          </p>
        </div>

        <Link
          href="/pano"
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-indigo-500/15 px-4 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/25 transition-colors"
        >
          Panoya dön / Back to dashboard
        </Link>
      </div>
    </main>
  )
}
