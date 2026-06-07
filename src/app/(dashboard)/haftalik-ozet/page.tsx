import { Suspense } from 'react'
import { CrownWeeklyPage } from './_components/CrownWeeklyPage'

export default function HaftalikOzetPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
          <div className="mx-auto h-8 max-w-lg animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
        </main>
      }
    >
      <CrownWeeklyPage />
    </Suspense>
  )
}
