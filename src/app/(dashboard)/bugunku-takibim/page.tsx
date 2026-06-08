import { Suspense } from 'react'
import { DailyTrackPage } from './_components/DailyTrackPage'

export default function BugunkuTakibimPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
          <div className="mx-auto h-8 max-w-lg animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
        </main>
      }
    >
      <DailyTrackPage />
    </Suspense>
  )
}
