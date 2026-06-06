import { Suspense } from 'react'
import { IlgilenHub } from './_components/IlgilenHub'

function PageSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8">
      <div className="w-full space-y-5 md:mx-auto md:max-w-5xl">
        <div className="h-7 w-40 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
        <div className="h-14 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[var(--bg-subtle)]" />
          ))}
        </div>
      </div>
    </main>
  )
}

export default function IlgilenPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <IlgilenHub />
    </Suspense>
  )
}
